"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { DEFAULTS, evalDeadline } from "@/lib/settings-model";
import { createAssignmentForProgramLevel, ensureEvaluation, releaseScore } from "@/lib/assignment-actions";

export type ActionResult = { ok: true } | { ok: false; error: string };

function refresh() {
  for (const p of ["/portal/assignment", "/portal/dashboard", "/portal/events", "/portal/evaluation", "/portal/extension-monitoring", "/portal/aaccup-copc"]) revalidatePath(p);
}

async function qac() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "qac_personnel" && user.role !== "qac_admin")) return null;
  return user;
}

export async function saveAssignment(input: {
  assignmentId: string | null;
  programId: string;
  levelId: string;
  accreditorIds: string[];
  acting: Record<string, string>;
  siteVisitDate: string;
  dueDate: string | null;
}): Promise<{ ok: true; assignmentId: string } | { ok: false; error: string }> {
  if (!(await qac())) return { ok: false, error: "Only QAC can assign accreditors." };
  if (input.accreditorIds.length !== 2) return { ok: false, error: "Select exactly 2 accreditors." };
  if (!input.siteVisitDate) return { ok: false, error: "Pick the site visit date." };
  const supabase = await createClient();
  const { data: rules } = await supabase.from("site_settings").select("value").eq("key", "rules").maybeSingle();
  const evalDays = Number((rules?.value as { evalDays?: number } | null)?.evalDays) || DEFAULTS.rules.evalDays;
  const dueDate = input.dueDate || evalDeadline(input.siteVisitDate, evalDays);
  let id = input.assignmentId;
  if (!id) {
    const r = await createAssignmentForProgramLevel(input.programId, input.levelId, input.accreditorIds, dueDate, input.siteVisitDate);
    if (!r.ok) return r;
    id = r.assignmentId;
  } else {
    const { data: team } = await supabase.from("assignment_accreditors").select("profile_id").eq("assignment_id", id);
    const have = (team ?? []).map((m) => m.profile_id);
    const drop = have.filter((x) => !input.accreditorIds.includes(x));
    const add = input.accreditorIds.filter((x) => !have.includes(x));
    if (drop.length) {
      const { error } = await supabase.from("assignment_accreditors").delete().eq("assignment_id", id).in("profile_id", drop);
      if (error) return { ok: false, error: error.message };
    }
    if (add.length) {
      const { error } = await supabase.from("assignment_accreditors").insert(add.map((p) => ({ assignment_id: id!, profile_id: p })));
      if (error) return { ok: false, error: error.message };
    }
    const { error } = await supabase.from("assignments").update({ site_visit_date: input.siteVisitDate, due_date: dueDate }).eq("id", id);
    if (error) return { ok: false, error: error.message };
  }
  for (const [pid, reason] of Object.entries(input.acting)) {
    if (input.accreditorIds.includes(pid)) await supabase.from("assignment_accreditors").update({ acting_reason: reason }).eq("assignment_id", id).eq("profile_id", pid);
  }
  refresh();
  return { ok: true, assignmentId: id };
}

export async function startAccreditation(input: { programId: string; levelId: string }): Promise<ActionResult> {
  if (!(await qac())) return { ok: false, error: "Only QAC can start an accreditation." };
  const supabase = await createClient();
  const { data: latest } = await supabase.from("submissions").select("id").eq("program_id", input.programId).eq("level_id", input.levelId).limit(1);
  if (latest?.length) return { ok: false, error: "That program already has this level started. Open it from the program list." };
  const { data: cycle } = await supabase.from("accreditation_cycles").select("id").eq("status", "open").maybeSingle();
  if (!cycle) return { ok: false, error: "No accreditation cycle is open yet." };
  const { error } = await supabase.from("submissions").insert({ cycle_id: cycle.id, program_id: input.programId, level_id: input.levelId, status: "not_started" });
  if (error) return { ok: false, error: error.message };
  const [{ data: program }, { data: level }, { data: reps }] = await Promise.all([
    supabase.from("programs").select("name").eq("id", input.programId).maybeSingle(),
    supabase.from("accreditation_levels").select("name").eq("id", input.levelId).maybeSingle(),
    supabase.from("program_reps").select("profile_id").eq("program_id", input.programId),
  ]);
  await Promise.all(
    (reps ?? []).map((r) =>
      supabase.rpc("send_reminder", {
        p_profile: r.profile_id,
        p_title: `QAC started ${level?.name ?? "an"} accreditation for ${program?.name ?? "your program"}. Upload your documents.`,
        p_link: `/portal/submission?p=${input.programId}`,
      }),
    ),
  );
  refresh();
  for (const p of ["/portal/submission", "/portal/dashboard"]) revalidatePath(p);
  return { ok: true };
}

export async function sendReminder(profileId: string, title: string, link?: string): Promise<ActionResult> {
  if (!(await qac())) return { ok: false, error: "Only QAC can send reminders." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("send_reminder" as never, { p_profile: profileId, p_title: title, p_link: link ?? null } as never);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function reviewReport(assignmentId: string, accreditorId: string, decision: "acknowledged" | "returned", note?: string): Promise<ActionResult> {
  const user = await qac();
  if (!user) return { ok: false, error: "Only QAC can review reports." };
  if (decision === "returned" && !note?.trim()) return { ok: false, error: "Add a remark first" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("accreditor_reports")
    .update({ status: decision, qac_note: decision === "returned" ? note!.trim() : null, reviewed_by: user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("assignment_id", assignmentId)
    .eq("accreditor_id", accreditorId);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function recordVisitResult(input: {
  assignmentId: string;
  passed: boolean;
  certStatus: string;
  validFrom: string;
  validUntil: string | null;
}): Promise<ActionResult> {
  if (!(await qac())) return { ok: false, error: "Only QAC can record results." };
  const supabase = await createClient();
  const ensured = await ensureEvaluation(input.assignmentId);
  if (!ensured.ok) return ensured;
  const { data: reports } = await supabase.from("accreditor_reports").select("grand_mean").eq("assignment_id", input.assignmentId);
  const means = (reports ?? []).map((r) => Number(r.grand_mean)).filter((n) => !Number.isNaN(n));
  const score = means.length ? Math.round((means.reduce((s, n) => s + n, 0) / means.length) * 100) / 100 : null;
  const { data: asg } = await supabase.from("assignments").select("status").eq("id", input.assignmentId).maybeSingle();
  if (asg?.status === "in_progress") await supabase.from("assignments").update({ status: "for_psv" }).eq("id", input.assignmentId);
  if (asg && ["in_progress", "for_psv"].includes(asg.status)) await supabase.from("assignments").update({ status: "evaluated" }).eq("id", input.assignmentId);
  const { error } = await supabase
    .from("evaluations")
    .update({ outcome: input.passed ? "passed" : "failed", score, remarks: input.certStatus, evaluated_at: new Date().toISOString(), compliance_status: input.certStatus })
    .eq("assignment_id", input.assignmentId);
  if (error) return { ok: false, error: error.message };
  const rel = await releaseScore(input.assignmentId);
  if (!rel.ok) return rel;
  if (input.passed) {
    const { data: sub } = await supabase.from("assignments").select("submissions(program_id, level_id)").eq("id", input.assignmentId).maybeSingle();
    const s = sub?.submissions;
    if (s)
      await supabase
        .from("program_accreditations")
        .update({ granted_on: input.validFrom, ...(input.validUntil ? { valid_until: input.validUntil } : {}) })
        .eq("program_id", s.program_id)
        .eq("level_id", s.level_id)
        .eq("status", "active");
  }
  refresh();
  return { ok: true };
}
