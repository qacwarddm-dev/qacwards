import { createClient } from "@/lib/supabase/server";
import { BUCKETS, signedUrl } from "@/lib/storage";

/**
 * Reads behind round 2 §3 (specialty) and §4 (e-signature).
 *
 * Both hang off an accreditor's profile and both have two audiences — the
 * accreditor on their own Profile screen, and QAC Admin on User Management — so
 * neither read takes "me" for granted: every function is asked about a
 * `profileId`, and RLS decides whether the caller may have the answer.
 */

export type ExpertiseArea = { id: string; name: string };

/** The whole reference list, for the picker. ~20 rows, seeded in B1 and read by
 *  every authenticated user (`reference is readable by authenticated users`). */
export async function getExpertiseAreas(): Promise<ExpertiseArea[]> {
  const supabase = await createClient();

  const { data } = await supabase.from("expertise_areas").select("id, name").order("name");
  return data ?? [];
}

/** The area ids one accreditor currently holds. Ids, not names: the picker
 *  round-trips exactly what it was given, and names are not unique keys. */
export async function getExpertiseFor(profileId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("accreditor_expertise")
    .select("expertise_area_id")
    .eq("profile_id", profileId);

  return (data ?? []).map((row) => row.expertise_area_id);
}

/**
 * A short-lived URL for someone's signature, or null when they have not drawn
 * one or the caller may not see it.
 *
 * The `signatures` bucket is private and its read policy is narrower than the
 * avatars one — owner, QAC, and teammates on a shared assignment — so a null
 * here is as often "not yours to see" as "not set", and both render the same
 * way: no signature block.
 */
export async function getSignatureUrl(
  profileId: string,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;

  const supabase = await createClient();
  const signed = await signedUrl(supabase, BUCKETS.signatures, path);
  return signed.data;
}

export type Signatory = {
  id: string;
  name: string;
  response: string;
  signatureUrl: string | null;
};

/**
 * The sign-off block's data for one assignment's team — round 2 §4's "reused
 * automatically wherever their signature is required".
 *
 * Only accreditors who accepted are signatories. Someone who declined never
 * worked the sheet, and printing their mark under a verdict they took no part
 * in is exactly the misuse a stored signature invites.
 */
export async function getSignatories(assignmentId: string): Promise<Signatory[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("assignment_accreditors")
    .select("profile_id, response, profiles(surname, given_name, signature_path)")
    .eq("assignment_id", assignmentId)
    .eq("response", "accepted");

  return Promise.all(
    (data ?? []).map(async (m) => ({
      id: m.profile_id,
      name: m.profiles ? `${m.profiles.surname}, ${m.profiles.given_name}` : "—",
      response: m.response,
      signatureUrl: await getSignatureUrl(m.profile_id, m.profiles?.signature_path ?? null),
    })),
  );
}
