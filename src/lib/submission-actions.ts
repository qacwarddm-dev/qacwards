"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS, removeFile, signedUrl } from "@/lib/storage";

/**
 * Writes behind `/portal/submission`.
 *
 * As with `admin.ts`, none of these check the caller's role or programme —
 * every one runs on the session client and RLS is the authorization. The policies
 * also carry the two rules that are easy to forget in application code: uploads
 * require an **open** cycle (O-14's freeze), and deletion is only possible before
 * submitting (O-16).
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * The submission a representative is filling in for one programme and level,
 * creating it on first use.
 *
 * Created lazily rather than pre-seeding five rows per programme per cycle: at
 * ~230 programmes that would be over a thousand empty rows a cycle, and a level
 * nobody attempts should leave no trace.
 */
export async function ensureSubmission(
  programId: string,
  levelId: string,
): Promise<{ ok: true; submissionId: string } | { ok: false; error: string }> {
  const supabase = await createClient();

  const { data: cycle } = await supabase
    .from("accreditation_cycles")
    .select("id")
    .eq("status", "open")
    .maybeSingle();

  if (!cycle) {
    return { ok: false, error: "No accreditation cycle is open yet." };
  }

  const { data: existing } = await supabase
    .from("submissions")
    .select("id")
    .eq("program_id", programId)
    .eq("level_id", levelId)
    .eq("cycle_id", cycle.id)
    .order("attempt", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return { ok: true, submissionId: existing.id };

  const { data: level } = await supabase
    .from("accreditation_levels")
    .select("code, ordinal")
    .eq("id", levelId)
    .maybeSingle();

  // Client's call 2026-09-06: PSV must be 100% (an active award) before a
  // programme can start Level I. Only gates the PSV→I transition — nothing
  // downstream in the assignment/submission state machines expressed it.
  if (level?.code === "I") {
    // `!level_id` disambiguates the embed: program_accreditations has two FKs
    // into accreditation_levels (level_id, demoted_from_level_id), and an
    // unqualified embed errors as ambiguous — which came back as a silently
    // empty `data` here rather than a thrown exception, so this gate was
    // failing closed for every programme, even ones that genuinely passed PSV.
    const { data: psv } = await supabase
      .from("program_accreditations")
      .select("id, accreditation_levels!level_id!inner(code)")
      .eq("program_id", programId)
      .eq("status", "active")
      .eq("accreditation_levels.code", "PSV")
      .maybeSingle();

    if (!psv) {
      return {
        ok: false,
        error: "PSV must be fully passed before Level I can start.",
      };
    }
  }

  const { data: created, error } = await supabase
    .from("submissions")
    .insert({ cycle_id: cycle.id, program_id: programId, level_id: levelId })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/submission");
  return { ok: true, submissionId: created.id };
}

/**
 * Level III's pick-2-of-5.
 *
 * The whole set is replaced rather than toggled one at a time, so the stored
 * choices can never sit at three-of-five between two round trips. `required_choices`
 * is read from the level rather than hard-coded — Level III is 2 today, and the
 * column exists so that is a seed change rather than a code change.
 */
export async function setLevelChoices(
  submissionId: string,
  levelId: string,
  areaIds: string[],
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: level } = await supabase
    .from("accreditation_levels")
    .select("required_choices")
    .eq("id", levelId)
    .maybeSingle();

  const required = level?.required_choices ?? 0;
  if (required > 0 && areaIds.length !== required) {
    return {
      ok: false,
      error: `Choose exactly ${required} area${required === 1 ? "" : "s"}.`,
    };
  }

  const { error: clearError } = await supabase
    .from("submission_choices")
    .delete()
    .eq("submission_id", submissionId);

  if (clearError) return { ok: false, error: clearError.message };

  if (areaIds.length > 0) {
    const { error } = await supabase
      .from("submission_choices")
      .insert(areaIds.map((id) => ({ submission_id: submissionId, requirement_area_id: id })));
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/portal/submission");
  return { ok: true };
}

/**
 * Hand in the submission.
 *
 * Refused below 100% readiness. The readiness view is the authority for that, not
 * a count taken here — one definition of "complete", used by the tiles, the
 * dashboards and this gate alike.
 */
export async function submitForEvaluation(submissionId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: readiness } = await supabase
    .from("submission_readiness")
    .select("readiness_percent, uploaded_count, required_count")
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (!readiness) return { ok: false, error: "That submission could not be found." };

  // readiness_percent is genuinely nullable — the view divides by
  // nullif(required_count, 0), so a level with zero required items yields
  // null rather than a number. required_count/uploaded_count are count(*)
  // and never null; the view just can't express that through Postgres's
  // catalog, so the generator marks every column nullable.
  const percent = readiness.readiness_percent ?? 0;
  const requiredCount = readiness.required_count ?? 0;
  const uploadedCount = readiness.uploaded_count ?? 0;

  if (percent < 100) {
    const missing = requiredCount - uploadedCount;
    return {
      ok: false,
      error: `${missing} document${missing === 1 ? " is" : "s are"} still missing.`,
    };
  }

  const { error } = await supabase
    .from("submissions")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", submissionId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/submission");
  return { ok: true };
}

export async function setWebsiteUrl(
  submissionId: string,
  url: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const trimmed = url.trim();
  if (trimmed !== "") {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { ok: false, error: "The website must be an http or https address." };
      }
    } catch {
      return { ok: false, error: "That is not a valid web address." };
    }
  }

  const { error } = await supabase
    .from("submissions")
    .update({ website_url: trimmed || null })
    .eq("id", submissionId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/submission");
  return { ok: true };
}

/**
 * O-16: a representative may remove a document **before** submitting, never
 * after. Afterwards the only route is superseding, which keeps the original file
 * and the decision about it on the record.
 *
 * The RLS policy is what enforces the timing; this deletes the row first and the
 * object second, so a policy refusal leaves the file exactly where it was rather
 * than orphaning it.
 */
export async function deleteDocument(documentId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("submission_documents")
    .select("storage_path")
    .eq("id", documentId)
    .maybeSingle();

  if (!doc) return { ok: false, error: "That document could not be found." };

  const { error } = await supabase
    .from("submission_documents")
    .delete()
    .eq("id", documentId);

  if (error) {
    return {
      ok: false,
      error: "That document can no longer be removed — the submission is in.",
    };
  }

  await removeFile(supabase, BUCKETS.submissions, doc.storage_path);

  revalidatePath("/portal/submission");
  return { ok: true };
}

/** A one-minute signed URL, minted only after RLS has allowed the row to be read.
 *  Buckets are private, so this is the only way a document is ever served. */
export async function getDocumentUrl(
  documentId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("submission_documents")
    .select("storage_path")
    .eq("id", documentId)
    .maybeSingle();

  if (!doc) return { ok: false, error: "That document could not be found." };

  const signed = await signedUrl(supabase, BUCKETS.submissions, doc.storage_path);
  if (signed.data === null) return { ok: false, error: signed.error };

  return { ok: true, url: signed.data };
}
