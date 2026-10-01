import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS, uploadFile } from "@/lib/storage";
import { MAX_UPLOAD_BYTES, checkTemplate, inspectPdf, mergePdfs, stampUuid } from "@/lib/pdf";

/**
 * Upload one document into a submission.
 *
 * The order matters: **validate → stamp → store → row**. Storing first would
 * leave an orphaned object behind every failed insert, and stamping after storing
 * would mean the stored bytes and the served bytes differ.
 *
 * Everything runs on the user's session client, so RLS decides whether this
 * submission may be written to at all — including whether its cycle is still open
 * (O-14's freeze) and whether it has already been submitted (O-16: delete and
 * replace before submitting, supersede after). This route does not re-check any
 * of that, deliberately: a second authorization system is a second thing to get
 * out of sync.
 *
 * Size and type are enforced here *and* on the bucket. The UI's
 * `accept="application/pdf"` and its "Maximum upload size of 25 MB" note are copy,
 * not controls (§8.1) — neither survives a direct POST.
 */
export const runtime = "nodejs"; // pdf-parse and pdf-lib both need Node APIs

type UploadBody = {
  submissionId: string;
  phaseDocumentId?: string;
  requirementAreaId?: string;
  supersedesId?: string;
  title: string;
  isDraft: boolean;
  note: string | null;
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // 30 uploads per 10 minutes — generous enough for a rep working through a
  // level's full document checklist in one sitting, tight enough to stop a
  // scripted loop. `check_rate_limit` is a security definer function
  // (B10, 20260818001400_rate_limits.sql); the caller identity it checks
  // comes from `auth.uid()` inside the function, not anything sent here.
  const { data: allowed } = await supabase.rpc("check_rate_limit", {
    p_route: "submissions_upload",
    p_max_count: 30,
    p_window_seconds: 600,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was sent." }, { status: 400 });
  }

  const body: UploadBody = {
    submissionId: String(form.get("submissionId") ?? ""),
    phaseDocumentId: (form.get("phaseDocumentId") as string) || undefined,
    requirementAreaId: (form.get("requirementAreaId") as string) || undefined,
    supersedesId: (form.get("supersedesId") as string) || undefined,
    title: String(form.get("title") ?? file.name),
    isDraft: form.get("isDraft") === "1",
    note: String(form.get("note") ?? "").trim() || null,
  };
  const additional = form.get("additional");

  if (!body.submissionId) {
    return NextResponse.json({ error: "Missing submission." }, { status: 400 });
  }

  // The CHECK constraint enforces this too; failing here gives a usable message
  // instead of a constraint name.
  const hasPhase = Boolean(body.phaseDocumentId);
  const hasArea = Boolean(body.requirementAreaId);
  if (hasPhase === hasArea) {
    return NextResponse.json(
      { error: "A document answers either a phase document or an area, not both." },
      { status: 400 },
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "That file is larger than 25 MB." },
      { status: 413 },
    );
  }

  let original = new Uint8Array(await file.arrayBuffer());

  const check = await inspectPdf(original);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 415 });
  }

  const { data: rules } = await supabase.from("site_settings").select("value").eq("key", "rules").maybeSingle();
  const formCode = ((rules?.value as { formCode?: string } | null)?.formCode ?? "QAC-TPL-01").trim() || null;
  const failures: { file: string; checks: Awaited<ReturnType<typeof checkTemplate>> }[] = [];
  const mainChecks = await checkTemplate(original, formCode);
  if (!Object.values(mainChecks).every(Boolean)) failures.push({ file: file.name, checks: mainChecks });

  let pageCount = check.pageCount;
  if (additional instanceof File && additional.size > 0) {
    if (additional.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "The additional document is larger than 25 MB." }, { status: 413 });
    }
    const extra = new Uint8Array(await additional.arrayBuffer());
    const extraCheck = await inspectPdf(extra);
    if (!extraCheck.ok) return NextResponse.json({ error: `Additional document: ${extraCheck.error}` }, { status: 415 });
    const extraTemplate = await checkTemplate(extra, formCode);
    if (!Object.values(extraTemplate).every(Boolean)) failures.push({ file: additional.name, checks: extraTemplate });
    if (!failures.length) {
      original = new Uint8Array(await mergePdfs(original, extra));
      pageCount += extraCheck.pageCount;
    }
  }
  if (failures.length) {
    const f = failures[0];
    return NextResponse.json(
      {
        error: !f.checks.text ? "No readable text (scanned)" : "PUP header/footer & form code not found",
        file: f.file,
        checks: f.checks,
        formCode,
      },
      { status: 422 },
    );
  }

  // Generated here rather than defaulted in the database, because the value has
  // to be inside the bytes before they are stored — the row cannot tell us what
  // it will be after the fact.
  const docUuid = crypto.randomUUID();

  let stamped: Uint8Array;
  try {
    stamped = await stampUuid(original, docUuid);
  } catch {
    return NextResponse.json(
      { error: "That PDF could not be stamped. It may be encrypted." },
      { status: 415 },
    );
  }

  // Version and path both derive from what is being replaced, so a supersede is
  // a new object rather than an overwrite — the rejected file has to survive.
  const version = body.supersedesId ? await nextVersion(supabase, body.supersedesId) : 1;
  const path = await storagePath(supabase, body.submissionId, docUuid);

  const stored = await uploadFile(supabase, BUCKETS.submissions, path, stamped, {
    contentType: "application/pdf",
  });
  if (stored.error) {
    return NextResponse.json({ error: stored.error }, { status: 403 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("submission_documents")
    .insert({
      submission_id: body.submissionId,
      phase_document_id: body.phaseDocumentId ?? null,
      requirement_area_id: body.requirementAreaId ?? null,
      title: body.title,
      storage_path: path,
      file_size: stamped.byteLength,
      page_count: pageCount,
      doc_uuid: docUuid,
      version,
      supersedes_id: body.isDraft ? null : (body.supersedesId ?? null),
      uploaded_by: user.id,
      is_draft: body.isDraft,
      is_current: !body.isDraft,
      upload_note: body.note,
    })
    .select("id")
    .single();

  if (insertError) {
    // The object is already stored and the row is not. Remove it rather than
    // leaving a file nothing references.
    await supabase.storage.from(BUCKETS.submissions).remove([path]);
    return NextResponse.json({ error: insertError.message }, { status: 403 });
  }

  if (body.isDraft) {
    return NextResponse.json({ id: inserted.id, docUuid, pageCount, draft: true });
  }

  if (body.supersedesId) {
    await supabase
      .from("submission_documents")
      .update({ is_current: false })
      .eq("id", body.supersedesId);
  }

  // A real upload replaces any draft saved for the same slot.
  const slotColumn = body.phaseDocumentId ? "phase_document_id" : "requirement_area_id";
  const { data: drafts } = await supabase
    .from("submission_documents")
    .select("id, storage_path")
    .eq("submission_id", body.submissionId)
    .eq(slotColumn, (body.phaseDocumentId ?? body.requirementAreaId)!)
    .eq("is_draft", true);
  if (drafts?.length) {
    await supabase.from("submission_documents").delete().in("id", drafts.map((d) => d.id));
    await supabase.storage.from(BUCKETS.submissions).remove(drafts.map((d) => d.storage_path));
  }

  // First upload moves a submission off not_started. Only that transition, and
  // only in that direction — everything else belongs to the workflow, not here.
  await supabase
    .from("submissions")
    .update({ status: "in_progress", updated_at: new Date().toISOString() })
    .eq("id", body.submissionId)
    .eq("status", "not_started");

  return NextResponse.json({ id: inserted.id, docUuid, pageCount });
}

type Client = Awaited<ReturnType<typeof createClient>>;

async function nextVersion(supabase: Client, supersedesId: string): Promise<number> {
  const { data } = await supabase
    .from("submission_documents")
    .select("version")
    .eq("id", supersedesId)
    .maybeSingle();
  return (data?.version ?? 0) + 1;
}

/**
 * `{cycle}/{program}/{level}/{doc_uuid}.pdf` — §2.8.
 *
 * Keyed on the document UUID rather than the file name: two uploads called
 * "Action Plan.pdf" must not collide, and a name is user-supplied text that has
 * no business in a storage path.
 */
async function storagePath(
  supabase: Client,
  submissionId: string,
  docUuid: string,
): Promise<string> {
  const { data } = await supabase
    .from("submissions")
    .select("cycle_id, program_id, level_id")
    .eq("id", submissionId)
    .maybeSingle();

  if (!data) return `unknown/${submissionId}/${docUuid}.pdf`;
  return `${data.cycle_id}/${data.program_id}/${data.level_id}/${docUuid}.pdf`;
}
