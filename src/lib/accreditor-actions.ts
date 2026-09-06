"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS, removeFile, signaturePath, uploadFile } from "@/lib/storage";

/**
 * Writes behind round 2 §2 (the second role), §3 (specialty) and §4 (signature).
 *
 * Like `admin.ts`, every one of these runs on the **user's** session client and
 * lets RLS decide. There is no role check in this file and there must not be
 * one: `20260906000200_accreditor_round2.sql` is the single authority, and a
 * check here would be a second one able to disagree with it. A caller without
 * the right role gets the database's refusal, not a hand-written one.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * §2 — QAC Admin gives an existing account the Internal Accreditor role as
 * well, for the case the client described: no accreditor is free for a
 * specialty, so a co-QAC-Personnel takes the assignment.
 *
 * An add, not a swap. `profiles.role` is untouched, so the person keeps every
 * QAC screen they had and gains the accreditor ones — which is what the note
 * asks for ("add", not "convert"). Swapping instead would be `setUserRole`,
 * which already exists next door in `admin.ts`.
 */
export async function setInternalAccreditorFlag(
  profileId: string,
  isInternalAccreditor: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", profileId)
    .maybeSingle();

  if (!target) return { ok: false, error: "That account could not be found." };
  if (target.role === "internal_accreditor") {
    return {
      ok: false,
      error: "That account already has the Internal Accreditor role on its own.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_internal_accreditor: isInternalAccreditor })
    .eq("id", profileId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/settings/users");
  return { ok: true };
}

/**
 * §3 — replace an accreditor's specialty set.
 *
 * Delete-then-insert of the whole set rather than a diff: the picker submits
 * what the specialty *is*, and reconstructing which rows changed would put a
 * second, subtly different idea of the answer in the client. The pair is not
 * atomic — PostgREST has no transaction across two calls — so a failed insert
 * after a successful delete clears the specialty rather than corrupting it,
 * which is the recoverable half of the two (the accreditor picks again) and is
 * why the error is surfaced rather than swallowed.
 *
 * Both entry points call this one function: the accreditor editing their own
 * profile passes their own id, QAC Admin passes someone else's, and the
 * policies decide which of those is allowed.
 */
export async function setAccreditorExpertise(
  profileId: string,
  areaIds: string[],
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error: clearError } = await supabase
    .from("accreditor_expertise")
    .delete()
    .eq("profile_id", profileId);

  if (clearError) return { ok: false, error: clearError.message };

  if (areaIds.length > 0) {
    const { error } = await supabase
      .from("accreditor_expertise")
      .insert(areaIds.map((id) => ({ profile_id: profileId, expertise_area_id: id })));

    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/portal/profile");
  revalidatePath("/portal/settings/users");
  return { ok: true };
}

/**
 * §4 — store the signature and point the profile at it.
 *
 * Always the caller's own: the path is built from `auth.uid()`, never from a
 * parameter, so there is no id for a caller to pass that would write into
 * someone else's folder. The storage policy enforces the same thing a second
 * time; this is belt and braces on the one write in the system that forges a
 * person's mark if it goes wrong.
 *
 * The image is produced by a canvas in the browser, so it is a PNG whether the
 * accreditor drew it or typed it — the bucket accepts nothing else, and one
 * fixed path per person means replacing a signature overwrites rather than
 * accumulating.
 */
export async function saveSignature(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const file = formData.get("signature");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Draw or type a signature first." };
  }
  if (file.type !== "image/png") {
    return { ok: false, error: "A signature must be a PNG." };
  }

  const path = signaturePath(user.id);
  const uploaded = await uploadFile(supabase, BUCKETS.signatures, path, file, {
    contentType: "image/png",
    upsert: true,
  });

  if (uploaded.error !== null) return { ok: false, error: uploaded.error };

  const { error } = await supabase
    .from("profiles")
    .update({ signature_path: uploaded.data.path })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/profile");
  return { ok: true };
}

/** Remove the stored signature. The object goes as well as the pointer — a
 *  signature nobody references is still a signature sitting in a bucket. */
export async function clearSignature(): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("signature_path")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.signature_path) return { ok: true };

  const { error } = await supabase
    .from("profiles")
    .update({ signature_path: null })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  await removeFile(supabase, BUCKETS.signatures, profile.signature_path);

  revalidatePath("/portal/profile");
  return { ok: true };
}

/** The picker needs the reference list and the current set together, and a
 *  client component cannot read them itself — `@/lib/accreditor` builds the
 *  cookie-backed server client. QAC Admin opens one user at a time, so this is
 *  fetched on demand rather than for every row of the table. */
export async function fetchExpertiseFor(
  profileId: string,
): Promise<{ areas: { id: string; name: string }[]; selected: string[] }> {
  const { getExpertiseAreas, getExpertiseFor } = await import("@/lib/accreditor");
  const [areas, selected] = await Promise.all([
    getExpertiseAreas(),
    getExpertiseFor(profileId),
  ]);
  return { areas, selected };
}
