"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS, signaturePath, uploadFile } from "@/lib/storage";

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
