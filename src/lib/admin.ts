"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { drainEmailOutbox, type DrainResult } from "@/lib/mailer-drain";
import type { UserRole } from "@/lib/database.types";

/**
 * Server actions behind `/portal/settings`.
 *
 * Every one of these runs on the **user's** session client, so RLS is what
 * decides whether the caller may do it — these functions do not check the role
 * themselves and must not start to. A role check here would be a second
 * authorization system that can disagree with the first; the policies in
 * `20260818000400_cycles_and_admin.sql` are the only ones that matter, and a
 * caller without the right role gets zero rows back rather than a refusal
 * (plans/BACKEND.md §1).
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createCycle(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");

  if (!name || !startDate || !endDate) {
    return { ok: false, error: "Name, start date and end date are required." };
  }
  if (endDate < startDate) {
    return { ok: false, error: "The end date cannot fall before the start date." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("accreditation_cycles").insert({
    name,
    description: description || null,
    start_date: startDate,
    end_date: endDate,
    created_by: user?.id ?? null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/settings/cycles");
  return { ok: true };
}

/**
 * Open or close a cycle.
 *
 * Only one cycle may be open at a time — a partial unique index enforces it, so
 * opening a second one fails in the database rather than depending on this
 * function remembering to check. Closing is what O-14 calls freezing: the work
 * stays visible as history and B4's write policies stop accepting uploads.
 */
export async function setCycleStatus(
  cycleId: string,
  status: "draft" | "open" | "closed",
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("accreditation_cycles")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", cycleId);

  if (error) {
    return {
      ok: false,
      error: error.message.includes("accreditation_cycles_single_open_idx")
        ? "Another cycle is already open. Close it before opening this one."
        : error.message,
    };
  }

  revalidatePath("/portal/settings/cycles");
  return { ok: true };
}

export async function attachRepToProgram(
  profileId: string,
  programId: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("program_reps")
    .insert({ profile_id: profileId, program_id: programId });

  if (error) {
    return {
      ok: false,
      error: error.message.includes("duplicate")
        ? "That representative already holds this programme."
        : error.message,
    };
  }

  revalidatePath("/portal/settings/reps");
  return { ok: true };
}

/**
 * O-15: access follows the current mapping. Detaching a representative from a
 * programme removes their access to its submissions immediately, including ones
 * they filed themselves — `my_program_ids()` reads the live table, so there is no
 * lingering grant to clean up.
 */
export async function detachRepFromProgram(
  profileId: string,
  programId: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("program_reps")
    .delete()
    .eq("profile_id", profileId)
    .eq("program_id", programId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/settings/reps");
  return { ok: true };
}

export async function setUserActive(
  profileId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Locking yourself out is not a recoverable mistake through this screen —
  // there is no second admin guaranteed to exist to undo it.
  if (user?.id === profileId && !isActive) {
    return { ok: false, error: "You cannot deactivate your own account." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", profileId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/settings/users");
  return { ok: true };
}

export async function setUserRole(
  profileId: string,
  role: UserRole,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id === profileId) {
    return { ok: false, error: "You cannot change your own role." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", profileId);

  if (error) return { ok: false, error: error.message };

  // The role also lives in app_metadata on the JWT, and only the Auth admin API
  // can rewrite that — which needs the service role and therefore cannot happen
  // here. Until the user's token next refreshes, `auth_role()` (which reads the
  // profiles table, not the JWT) is what every policy uses, so the change takes
  // effect immediately for authorization. See MANUAL STEPS M-4.
  revalidatePath("/portal/settings/users");
  return { ok: true };
}

export type UserSearchRow = {
  id: string;
  name: string;
  webmail: string;
  role: UserRole;
  isActive: boolean;
  isInternalAccreditor: boolean;
};

/**
 * §8.2: runs through RLS (only QAC's policy on `profiles` returns more than
 * the caller's own row, so a non-QAC caller searching gets back at most
 * themselves — the search cannot reveal that anyone else exists). The three
 * `ilike` conditions each use their own trigram index
 * (`20260818001300_search_trgm.sql`) rather than a sequential scan.
 */
export async function searchUsers(query: string): Promise<UserSearchRow[]> {
  const supabase = await createClient();
  const q = `%${query.trim()}%`;

  const { data } = await supabase
    .from("profiles")
    .select("id, surname, given_name, webmail, role, is_active, is_internal_accreditor")
    .or(`surname.ilike.${q},given_name.ilike.${q},webmail.ilike.${q}`)
    .order("surname")
    .limit(50);

  return (data ?? []).map((u) => ({
    id: u.id,
    name: `${u.surname}, ${u.given_name}`,
    webmail: u.webmail,
    role: u.role,
    isActive: u.is_active,
    isInternalAccreditor: u.is_internal_accreditor,
  }));
}

export type DrainActionResult =
  | ({ ok: true } & DrainResult)
  | { ok: false; error: string };

/**
 * "Send queued emails now" — the manual counterpart to the daily
 * `/api/cron/email` sweep, added because Vercel's Hobby plan only runs cron
 * once a day. Runs on the caller's own QAC Admin session, not the mailer job
 * account and not `CRON_SECRET` — `email_outbox` is admin-scoped by RLS, so
 * the same policy that gates the cron job's dedicated account already gates
 * this button for whoever is signed in.
 */
export async function sendQueuedEmailsNow(): Promise<DrainActionResult> {
  const supabase = await createClient();

  try {
    const result = await drainEmailOutbox(supabase);
    revalidatePath("/portal/settings");
    return { ok: true, ...result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
