"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { BUCKETS, uploadFile } from "@/lib/storage";
import { DEFAULTS, type SettingKey } from "@/lib/settings-model";
import type { UserRole } from "@/lib/database.types";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type DataResult<T> = { ok: true; data: T } | { ok: false; error: string };

const BACKUP_TABLES = [
  "accreditation_cycles",
  "accreditation_levels",
  "requirement_areas",
  "phases",
  "phase_documents",
  "colleges",
  "campuses",
  "positions",
  "programs",
  "profiles",
  "program_reps",
  "accreditor_expertise",
  "expertise_areas",
  "submissions",
  "submission_choices",
  "submission_documents",
  "document_reviews",
  "submission_returns",
  "assignments",
  "assignment_accreditors",
  "evaluations",
  "evaluation_items",
  "area_ratings",
  "accreditor_reports",
  "program_accreditations",
  "events",
  "event_audiences",
  "event_programs",
  "templates",
  "template_versions",
  "common_documents",
  "ndas",
  "nda_issuances",
  "repository_folders",
  "repository_files",
  "repository_units",
  "visit_evaluations",
  "announcements",
  "site_settings",
  "saved_reports",
  "user_invitations",
] as const;

async function admin() {
  const user = await getCurrentUser();
  return user && user.role === "qac_admin" ? user : null;
}

function refresh() {
  revalidatePath("/portal/settings");
  revalidatePath("/portal/dashboard");
  revalidatePath("/portal/assignment");
}

const DENIED = { ok: false as const, error: "Only the QAC Admin can change settings." };

export async function saveSetting<K extends SettingKey>(key: K, value: (typeof DEFAULTS)[K]): Promise<ActionResult> {
  const user = await admin();
  if (!user) return DENIED;
  if (key === "rules") {
    const r = value as (typeof DEFAULTS)["rules"];
    const whole = (n: number) => Number.isInteger(n) && n >= 1;
    if (!whole(r.perProgram)) return { ok: false, error: "Internal accreditors per program must be a whole number, at least 1." };
    if (!whole(r.acceptDays) || !whole(r.evalDays)) return { ok: false, error: "Days must be whole numbers, at least 1." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert({ key, value: value as never, updated_by: user.id, updated_at: new Date().toISOString() });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function openCycle(input: { name: string; start: string; end: string; carry: boolean }): Promise<ActionResult> {
  const user = await admin();
  if (!user) return DENIED;
  const name = input.name.trim();
  if (!name || !input.start || !input.end) return { ok: false, error: "Enter the name and both dates." };
  if (input.end < input.start) return { ok: false, error: "The closing date cannot fall before the opening date." };
  const supabase = await createClient();
  const { data: prev } = await supabase.from("accreditation_cycles").select("id").eq("status", "closed").order("end_date", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await supabase
    .from("accreditation_cycles")
    .insert({ name, start_date: input.start, end_date: input.end, status: "open", created_by: user.id })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message.includes("single_open") ? "Close the open cycle first" : error.message };
  if (input.carry && prev) {
    const { error: cErr } = await supabase
      .from("submissions")
      .update({ cycle_id: data.id })
      .eq("cycle_id", prev.id)
      .in("status", ["not_started", "in_progress", "returned"]);
    if (cErr) return { ok: false, error: `Cycle opened, but unfinished programs could not be carried over: ${cErr.message}` };
  }
  refresh();
  return { ok: true };
}

export async function closeCycle(id: string, backupFirst: boolean): Promise<ActionResult> {
  const user = await admin();
  if (!user) return DENIED;
  if (backupFirst) {
    const b = await createBackup("Manual · before closing a cycle");
    if (!b.ok) return { ok: false, error: `Backup failed, so the cycle was not closed: ${b.error}` };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accreditation_cycles")
    .update({ status: "closed", closed_at: new Date().toISOString(), closed_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "That cycle could not be closed." };
  refresh();
  return { ok: true };
}

export async function extendCycle(id: string, end: string, notify: boolean): Promise<ActionResult> {
  const user = await admin();
  if (!user) return DENIED;
  const supabase = await createClient();
  const { data: c } = await supabase.from("accreditation_cycles").select("name, start_date").eq("id", id).maybeSingle();
  if (!c) return { ok: false, error: "That cycle no longer exists." };
  if (!end || end < c.start_date) return { ok: false, error: "Pick an end date after the cycle opens." };
  const { error } = await supabase.from("accreditation_cycles").update({ end_date: end, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  if (notify) {
    const { data: people } = await supabase.from("profiles").select("id").eq("is_active", true).or("role.in.(program_representative,internal_accreditor),is_internal_accreditor.eq.true");
    const when = new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    await Promise.all((people ?? []).map((p) => supabase.rpc("send_reminder", { p_profile: p.id, p_title: `${c.name} now ends ${when}`, p_link: "/portal/events" })));
  }
  refresh();
  return { ok: true };
}

export async function addArea(levelId: string, name: string): Promise<ActionResult> {
  if (!(await admin())) return DENIED;
  if (!name.trim()) return { ok: false, error: "Enter a name" };
  const supabase = await createClient();
  const { data: last } = await supabase.from("requirement_areas").select("ordinal").eq("level_id", levelId).order("ordinal", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("requirement_areas").insert({ level_id: levelId, name: name.trim(), ordinal: (last?.ordinal ?? 0) + 1 });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function removeArea(id: string): Promise<ActionResult> {
  if (!(await admin())) return DENIED;
  const supabase = await createClient();
  const { data, error } = await supabase.from("requirement_areas").delete().eq("id", id).select("id");
  if (error) return { ok: false, error: error.code === "23503" ? "Programs already uploaded for this area, so it can’t be removed." : error.message };
  if (!data?.length) return { ok: false, error: "That area could not be removed." };
  refresh();
  return { ok: true };
}

export async function addPhaseDoc(phaseId: string, name: string): Promise<ActionResult> {
  if (!(await admin())) return DENIED;
  if (!name.trim()) return { ok: false, error: "Enter a name" };
  const supabase = await createClient();
  const { data: last } = await supabase.from("phase_documents").select("ordinal").eq("phase_id", phaseId).order("ordinal", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("phase_documents").insert({ phase_id: phaseId, name: name.trim(), ordinal: (last?.ordinal ?? 0) + 1 });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function removePhaseDoc(id: string): Promise<ActionResult> {
  if (!(await admin())) return DENIED;
  const supabase = await createClient();
  const { data, error } = await supabase.from("phase_documents").delete().eq("id", id).select("id");
  if (error) return { ok: false, error: error.code === "23503" ? "Programs already uploaded this document, so it can’t be removed." : error.message };
  if (!data?.length) return { ok: false, error: "That document could not be removed." };
  refresh();
  return { ok: true };
}

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;
}

const ROLE_NAME: Record<string, string> = {
  qac_admin: "QAC Admin",
  qac_personnel: "QAC Personnel",
  internal_accreditor: "Internal Accreditor",
  program_representative: "Academic Program",
};

async function queueInvite(email: string, given: string, role: string) {
  const supabase = await createClient();
  const link = `${await origin()}/register?email=${encodeURIComponent(email)}`;
  return supabase.rpc("admin_queue_email", {
    p_to: email,
    p_subject: "[QAC-WARDS] You’re invited to QAC-WARDS",
    p_body: `Good day, ${given}.\n\nThe PUP Quality Assurance Center invited you to QAC-WARDS as ${ROLE_NAME[role] ?? role}.\n\nCreate your account with this webmail here:\n${link}\n\n— Quality Assurance Center`,
  });
}

export async function inviteUser(input: { surname: string; given: string; email: string; role: UserRole; ia: boolean }): Promise<ActionResult> {
  const user = await admin();
  if (!user) return DENIED;
  const email = input.email.trim().toLowerCase();
  if (!input.surname.trim() || !input.given.trim()) return { ok: false, error: "Enter the name" };
  if (!/@pup\.edu\.ph$/i.test(email)) return { ok: false, error: "Use a PUP webmail (@pup.edu.ph)" };
  const supabase = await createClient();
  const { data: dup } = await supabase.from("profiles").select("id, deleted_at").ilike("webmail", email).limit(1);
  if (dup?.length) return { ok: false, error: dup[0].deleted_at ? "That person was deleted. Restore them from Recently Deleted." : "That webmail already has an account" };
  const { error } = await supabase.from("user_invitations").insert({
    webmail: email,
    surname: input.surname.trim(),
    given_name: input.given.trim(),
    role: input.role,
    is_internal_accreditor: input.ia && input.role !== "internal_accreditor",
    invited_by: user.id,
  });
  if (error) return { ok: false, error: error.code === "23505" ? "That webmail was already invited" : error.message };
  const q = await queueInvite(email, input.given.trim(), input.role);
  if (q.error) return { ok: false, error: `Invitation saved, but the email could not be queued: ${q.error.message}` };
  refresh();
  return { ok: true };
}

const DONE_ASSIGNMENT = ["evaluated", "score_returned", "declined"];

export async function deleteUser(id: string): Promise<ActionResult> {
  const me = await admin();
  if (!me) return DENIED;
  if (me.id === id) return { ok: false, error: "You cannot delete your own account." };
  const supabase = await createClient();
  const { data: target } = await supabase.from("profiles").select("role, webmail, is_active, deleted_at").eq("id", id).maybeSingle();
  if (!target || target.deleted_at) return { ok: false, error: "That user no longer exists." };
  const mailer = (process.env.MAILER_EMAIL ?? "").toLowerCase();
  if (mailer && target.webmail.toLowerCase() === mailer) return { ok: false, error: "The System account is locked." };
  if (target.role === "qac_admin" && target.is_active) {
    const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "qac_admin").eq("is_active", true).is("deleted_at", null);
    if ((count ?? 0) <= 1) return { ok: false, error: "This is the last active QAC Admin." };
  }
  const { data: team } = await supabase.from("assignment_accreditors").select("assignments(status)").eq("profile_id", id).neq("response", "rejected");
  if ((team ?? []).some((t) => t.assignments && !DONE_ASSIGNMENT.includes(t.assignments.status))) {
    return { ok: false, error: "This person has evaluations in progress. Reassign them first." };
  }
  const { error } = await supabase.from("profiles").update({ is_active: false, deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await supabase.rpc("admin_end_sessions", { p_user: id });
  refresh();
  revalidatePath("/portal/recently-deleted");
  return { ok: true };
}

export async function restoreUser(id: string): Promise<ActionResult> {
  if (!(await admin())) return DENIED;
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").update({ is_active: true, deleted_at: null }).eq("id", id).not("deleted_at", "is", null).select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "That user could not be restored." };
  refresh();
  revalidatePath("/portal/recently-deleted");
  return { ok: true };
}

export async function deleteInvitation(id: string): Promise<ActionResult> {
  if (!(await admin())) return DENIED;
  const supabase = await createClient();
  const { data, error } = await supabase.from("user_invitations").delete().eq("id", id).select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "That invitation no longer exists." };
  refresh();
  return { ok: true };
}

export async function resendInvite(id: string): Promise<ActionResult> {
  if (!(await admin())) return DENIED;
  const supabase = await createClient();
  const { data: i } = await supabase.from("user_invitations").select("webmail, given_name, role, sent_count").eq("id", id).maybeSingle();
  if (!i) return { ok: false, error: "That invitation no longer exists." };
  const q = await queueInvite(i.webmail, i.given_name, i.role);
  if (q.error) return { ok: false, error: q.error.message };
  await supabase.from("user_invitations").update({ sent_count: i.sent_count + 1, invited_at: new Date().toISOString() }).eq("id", id);
  refresh();
  return { ok: true };
}

export async function editUser(id: string, input: { surname: string; given: string; ia: boolean; positionId: string | null }): Promise<ActionResult> {
  if (!(await admin())) return DENIED;
  if (!input.surname.trim() || !input.given.trim()) return { ok: false, error: "Enter the name" };
  const supabase = await createClient();
  if (input.positionId) {
    const { data: pos } = await supabase.from("positions").select("id").eq("id", input.positionId).maybeSingle();
    if (!pos) return { ok: false, error: "Choose a valid position" };
  }
  const { data, error } = await supabase
    .from("profiles")
    .update({ surname: input.surname.trim(), given_name: input.given.trim(), is_internal_accreditor: input.ia, position_id: input.positionId })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "That user could not be updated." };
  refresh();
  return { ok: true };
}

export async function sendPasswordReset(email: string): Promise<ActionResult> {
  if (!(await admin())) return DENIED;
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${await origin()}/login/reset` });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function endSessions(target: { session?: string; user?: string }): Promise<DataResult<number>> {
  const me = await admin();
  if (!me) return DENIED;
  if (target.user === me.id) return { ok: false, error: "Use Sign out on your own account menu instead." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_end_sessions", { p_session: target.session ?? undefined, p_user: target.user ?? undefined });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal/settings");
  return { ok: true, data: data ?? 0 };
}

export async function addProgram(name: string, collegeId: string, campusIds: string[]): Promise<ActionResult> {
  if (!(await admin())) return DENIED;
  const n = name.trim().replace(/\s+/g, " ");
  if (!n) return { ok: false, error: "Enter the program name" };
  if (!campusIds.length) return { ok: false, error: "Choose at least one campus" };
  const supabase = await createClient();
  const { data: campuses } = await supabase.from("campuses").select("id, is_main").in("id", campusIds);
  const { data: dup } = await supabase.from("programs").select("campus_id").in("campus_id", campusIds).ilike("name", n);
  if (dup?.length) return { ok: false, error: "That program already exists on one of these campuses" };
  const { error } = await supabase.from("programs").insert((campuses ?? []).map((c) => ({ name: n, college_id: c.is_main ? collegeId || null : null, campus_id: c.id })));
  if (error) return { ok: false, error: error.code === "23505" ? "A deleted program with that name is on one of these campuses. Restore it from Recently Deleted." : error.message };
  refresh();
  return { ok: true };
}

export async function deleteProgram(id: string): Promise<ActionResult> {
  if (!(await admin())) return DENIED;
  const supabase = await createClient();
  const { count } = await supabase.from("submissions").select("id", { count: "exact", head: true }).eq("program_id", id).neq("status", "evaluated");
  if (count) return { ok: false, error: "This program has an accreditation in progress. Finish or remove it first." };
  const { data, error } = await supabase.from("programs").update({ deleted_at: new Date().toISOString() }).eq("id", id).is("deleted_at", null).select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "That program could not be deleted." };
  refresh();
  revalidatePath("/portal/recently-deleted");
  return { ok: true };
}

export async function restoreProgram(id: string): Promise<ActionResult> {
  if (!(await admin())) return DENIED;
  const supabase = await createClient();
  const { data, error } = await supabase.from("programs").update({ deleted_at: null }).eq("id", id).not("deleted_at", "is", null).select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "That program could not be restored." };
  refresh();
  revalidatePath("/portal/recently-deleted");
  return { ok: true };
}

export async function saveAnnouncement(input: { title: string; body: string; publishOn: string; audience: string; pinned: boolean }): Promise<ActionResult> {
  const user = await admin();
  if (!user) return DENIED;
  if (!input.title.trim()) return { ok: false, error: "Enter a title" };
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("announcements").insert({
    title: input.title.trim(),
    body: input.body.trim() || null,
    publish_on: input.publishOn || today,
    audience: input.audience,
    is_pinned: input.pinned,
    is_published: true,
    created_by: user.id,
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function updateAnnouncement(id: string, patch: { is_pinned?: boolean; is_published?: boolean; publish_on?: string }): Promise<ActionResult> {
  if (!(await admin())) return DENIED;
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  if (!(await admin())) return DENIED;
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function retryFailedEmails(): Promise<DataResult<number>> {
  if (!(await admin())) return DENIED;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("email_outbox")
    .update({ status: "pending", attempts: 0, last_error: null, next_attempt_at: new Date().toISOString() })
    .eq("status", "failed")
    .select("id");
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, data: data?.length ?? 0 };
}

async function dumpTable(supabase: Awaited<ReturnType<typeof createClient>>, table: string) {
  const rows: unknown[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from(table as "profiles")
      .select("*")
      .range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

export async function createBackup(note = "Manual"): Promise<ActionResult> {
  const user = await admin();
  if (!user) return DENIED;
  const supabase = await createClient();
  const started = new Date().toISOString();
  try {
    const out: Record<string, unknown[]> = {};
    for (const t of BACKUP_TABLES) out[t] = await dumpTable(supabase, t);
    const bytes = new TextEncoder().encode(JSON.stringify({ created_at: started, by: user.id, tables: out }));
    const path = `${started.slice(0, 10)}/${crypto.randomUUID()}.json`;
    const up = await uploadFile(supabase, BUCKETS.backups, path, bytes, { contentType: "application/json" });
    if (up.error) throw new Error(up.error);
    const { error } = await supabase.from("system_backups").insert({ kind: "manual", status: "ok", note, size_bytes: bytes.byteLength, storage_path: path, created_by: user.id });
    if (error) throw new Error(error.message);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("system_backups").insert({ kind: "manual", status: "fail", note, log: msg, created_by: user.id });
    refresh();
    return { ok: false, error: msg };
  }
  refresh();
  return { ok: true };
}

export async function backupUrl(id: string): Promise<DataResult<string>> {
  if (!(await admin())) return DENIED;
  const supabase = await createClient();
  const { data: b } = await supabase.from("system_backups").select("storage_path, created_at").eq("id", id).maybeSingle();
  if (!b?.storage_path) return { ok: false, error: "This backup has no file." };
  const { data, error } = await supabase.storage.from(BUCKETS.backups).createSignedUrl(b.storage_path, 300, { download: `QAC-WARDS-backup-${b.created_at.slice(0, 10)}.json` });
  if (error || !data) return { ok: false, error: error?.message ?? "Could not prepare the download." };
  return { ok: true, data: data.signedUrl };
}

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const csv = (rows: unknown[][]) => "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");

export async function exportData(kind: "programs" | "users" | "records" | "evaluations" | "activity"): Promise<DataResult<string>> {
  if (!(await admin())) return DENIED;
  const supabase = await createClient();
  if (kind === "programs") {
    const { data } = await supabase.from("programs").select("name, campuses(name), colleges(code)").is("deleted_at", null).order("name");
    return { ok: true, data: csv([["Program", "College", "Campus"], ...(data ?? []).map((p) => [p.name, p.colleges?.code ?? "", p.campuses?.name ?? ""])]) };
  }
  if (kind === "users") {
    const { data } = await supabase.from("profiles").select("surname, given_name, webmail, role, is_internal_accreditor, is_active").order("surname");
    return {
      ok: true,
      data: csv([["Surname", "Given name", "Webmail", "Role", "Also internal accreditor", "Active"], ...(data ?? []).map((p) => [p.surname, p.given_name, p.webmail, ROLE_NAME[p.role] ?? p.role, p.is_internal_accreditor ? "Yes" : "No", p.is_active ? "Yes" : "No"])]),
    };
  }
  if (kind === "records") {
    const { data } = await supabase.from("program_accreditations").select("status, granted_on, valid_until, programs(name, campuses(name)), accreditation_levels!level_id(name)").order("granted_on");
    return {
      ok: true,
      data: csv([["Program", "Campus", "Level", "Status", "Granted", "Valid until"], ...(data ?? []).map((r) => [r.programs?.name, r.programs?.campuses?.name, r.accreditation_levels?.name, r.status, r.granted_on, r.valid_until])]),
    };
  }
  if (kind === "evaluations") {
    const { data } = await supabase
      .from("accreditor_reports")
      .select("status, grand_mean, signed_at, doc_code, profiles:accreditor_id(surname, given_name), assignments(submissions(programs(name), accreditation_levels(name)))")
      .order("signed_at");
    return {
      ok: true,
      data: csv([
        ["Program", "Level", "Accreditor", "Status", "Grand mean", "Signed", "Document ID"],
        ...(data ?? []).map((r) => [
          r.assignments?.submissions?.programs?.name,
          r.assignments?.submissions?.accreditation_levels?.name,
          r.profiles ? `${r.profiles.surname}, ${r.profiles.given_name}` : "",
          r.status,
          r.grand_mean,
          r.signed_at,
          r.doc_code,
        ]),
      ]),
    };
  }
  const { data } = await supabase.from("activity_logs").select("created_at, action_type, target_table, profiles:actor_id(surname, given_name)").order("created_at", { ascending: false }).limit(5000);
  return {
    ok: true,
    data: csv([["When", "Action", "Table", "By"], ...(data ?? []).map((a) => [a.created_at, a.action_type, a.target_table, a.profiles ? `${a.profiles.surname}, ${a.profiles.given_name}` : "System"])]),
  };
}
