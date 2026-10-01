"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canAdvanceAssignment } from "@/lib/assignment-transitions";

/**
 * Writes behind assignments and evaluations.
 *
 * The two state machines (`@/lib/assignment-transitions`) are plain transition
 * tables plus a Postgres enum rather than XState (§0.2): two machines with at
 * most six states each, where a library would add a dependency and a second
 * place for the truth to live.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * QAC assigns a team to a submitted submission.
 *
 * One assignment per submission (a UNIQUE constraint says so); a retake is a new
 * submission row and therefore gets its own assignment, which is how a failed
 * attempt keeps its history.
 */
export async function createAssignment(
  submissionId: string,
  accreditorIds: string[],
  dueDate: string | null,
  siteVisitDate: string | null = null,
): Promise<{ ok: true; assignmentId: string } | { ok: false; error: string }> {
  const supabase = await createClient();

  // Client's call 2026-09-06: every assignment team is exactly 2 accreditors.
  if (accreditorIds.length !== 2) {
    return { ok: false, error: "Choose exactly 2 accreditors." };
  }

  const { data: submission } = await supabase
    .from("submissions")
    .select("id, cycle_id, status")
    .eq("id", submissionId)
    .maybeSingle();

  if (!submission) return { ok: false, error: "That submission could not be found." };
  if (submission.status !== "submitted") {
    return { ok: false, error: "Only a submitted submission can be assigned." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: assignment, error } = await supabase
    .from("assignments")
    .insert({
      cycle_id: submission.cycle_id,
      submission_id: submissionId,
      assigned_by: user?.id ?? null,
      due_date: dueDate,
      site_visit_date: siteVisitDate,
    })
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      error: error.message.includes("duplicate")
        ? "That submission already has an assignment."
        : error.message,
    };
  }

  const { error: teamError } = await supabase
    .from("assignment_accreditors")
    .insert(accreditorIds.map((id) => ({ assignment_id: assignment.id, profile_id: id })));

  if (teamError) return { ok: false, error: teamError.message };

  await supabase
    .from("submissions")
    .update({ status: "under_evaluation" })
    .eq("id", submissionId);

  revalidatePath("/portal/assignment");
  return { ok: true, assignmentId: assignment.id };
}

/**
 * Accept or reject an invitation. RLS restricts the row to the caller's own, so
 * one team member cannot answer for another.
 */
export async function respondToAssignment(
  assignmentId: string,
  response: "accepted" | "rejected",
  rejectionNote?: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  if (response === "rejected" && !rejectionNote?.trim()) {
    return { ok: false, error: "Give a reason for declining." };
  }

  const { error } = await supabase
    .from("assignment_accreditors")
    .update({
      response,
      rejection_note: rejectionNote?.trim() || null,
      responded_at: new Date().toISOString(),
    })
    .eq("assignment_id", assignmentId)
    .eq("profile_id", user.id);

  if (error) return { ok: false, error: error.message };

  const { data: assignment } = await supabase
    .from("assignments")
    .select("status")
    .eq("id", assignmentId)
    .maybeSingle();

  // The first acceptance starts the work. Guarded by the transition table rather
  // than written unconditionally, so a later acceptance cannot drag a further-on
  // assignment backwards.
  if (response === "accepted") {
    if (assignment && canAdvanceAssignment(assignment.status, "in_progress")) {
      await supabase
        .from("assignments")
        .update({ status: "in_progress" })
        .eq("id", assignmentId);
    }
  } else if (assignment && canAdvanceAssignment(assignment.status, "declined")) {
    // Round 2 §1: the assignment returns to the QAC Personnel queue only once
    // the whole team has stepped back. One decline out of three still leaves two
    // accreditors who can work the sheet, and marking that assignment declined
    // would take it away from them.
    const { data: team } = await supabase
      .from("assignment_accreditors")
      .select("response")
      .eq("assignment_id", assignmentId);

    if ((team ?? []).length > 0 && (team ?? []).every((m) => m.response === "rejected")) {
      await supabase
        .from("assignments")
        .update({ status: "declined" })
        .eq("id", assignmentId);
    }
  }

  revalidatePath("/portal/assignment");
  return { ok: true };
}

/** Create the shared sheet on first open — one per assignment (UNIQUE). */
export async function ensureEvaluation(
  assignmentId: string,
): Promise<{ ok: true; evaluationId: string } | { ok: false; error: string }> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("evaluations")
    .select("id")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  if (existing) return { ok: true, evaluationId: existing.id };

  const { data, error } = await supabase
    .from("evaluations")
    .insert({ assignment_id: assignmentId })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, evaluationId: data.id };
}

/**
 * QAC releases the score.
 *
 * **This is what writes the award.** The `apply_award_on_release` trigger fires on
 * `released_at` going from null to non-null and applies §2.7's four transitions —
 * a pass grants a dated award, a failed revalidation demotes one level, a failed
 * first attempt changes nothing. Putting it in a trigger rather than here means a
 * release by any route applies the same rules.
 */
export async function releaseScore(assignmentId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: evaluation } = await supabase
    .from("evaluations")
    .select("id, outcome, released_at")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  if (!evaluation) return { ok: false, error: "There is no evaluation to release." };
  if (evaluation.released_at) return { ok: false, error: "That score is already released." };
  if (!evaluation.outcome) {
    return { ok: false, error: "Record a pass or fail before releasing." };
  }

  const { error } = await supabase
    .from("evaluations")
    .update({ released_at: new Date().toISOString(), released_by: user?.id ?? null })
    .eq("id", evaluation.id);

  if (error) return { ok: false, error: error.message };

  await supabase
    .from("assignments")
    .update({ status: "score_returned" })
    .eq("id", assignmentId);

  const { data: assignment } = await supabase
    .from("assignments")
    .select("submission_id")
    .eq("id", assignmentId)
    .maybeSingle();

  if (assignment) {
    await supabase
      .from("submissions")
      .update({ status: "evaluated" })
      .eq("id", assignment.submission_id);
  }

  revalidatePath("/portal/evaluation");
  revalidatePath("/portal/assignment");
  return { ok: true };
}

/**
 * Open a retake as attempt N+1.
 *
 * The uniqueness key is `(cycle_id, program_id, level_id, attempt)` precisely so
 * this is possible: the failed attempt keeps its own documents, assignment and
 * evaluation, and the retake starts clean beside it rather than on top of it
 * (§2.7). Assumption 3 allows a retake inside the same cycle.
 */
export async function openRetake(
  submissionId: string,
): Promise<{ ok: true; submissionId: string } | { ok: false; error: string }> {
  const supabase = await createClient();

  const { data: previous } = await supabase
    .from("submissions")
    .select("cycle_id, program_id, level_id, attempt, is_revalidation")
    .eq("id", submissionId)
    .maybeSingle();

  if (!previous) return { ok: false, error: "That submission could not be found." };

  const { data, error } = await supabase
    .from("submissions")
    .insert({
      cycle_id: previous.cycle_id,
      program_id: previous.program_id,
      level_id: previous.level_id,
      attempt: previous.attempt + 1,
      is_revalidation: previous.is_revalidation,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/submission");
  return { ok: true, submissionId: data.id };
}

/**
 * The frame's form picks a programme and a level, not a submission — but
 * `createAssignment` (like the `submissions` table itself) is keyed on a
 * submission id. QAC Personnel is the one who starts an accreditation
 * submission (not the programme representative), so this resolves the two to
 * a submitted submission for them: reusing one already at `submitted`,
 * force-submitting one a rep left mid-draft (`not_started`/`in_progress`/
 * `returned`), or — the common case, a programme that never touched this
 * level — starting one from scratch.
 *
 * A submission already at `under_evaluation` or `evaluated` is deliberately
 * left alone: that attempt already has (or had) an assignment, and a second
 * one belongs to `openRetake()`, not here.
 */
export async function createAssignmentForProgramLevel(
  programId: string,
  levelId: string,
  accreditorIds: string[],
  dueDate: string | null = null,
  siteVisitDate: string | null = null,
): Promise<{ ok: true; assignmentId: string } | { ok: false; error: string }> {
  const supabase = await createClient();

  const { data: latest } = await supabase
    .from("submissions")
    .select("id, status")
    .eq("program_id", programId)
    .eq("level_id", levelId)
    .order("attempt", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest?.status === "submitted") {
    return createAssignment(latest.id, accreditorIds, dueDate, siteVisitDate);
  }

  if (latest && ["under_evaluation", "evaluated"].includes(latest.status)) {
    return {
      ok: false,
      error: "That programme and level already has an assignment for its current attempt.",
    };
  }

  if (latest) {
    const { error } = await supabase
      .from("submissions")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", latest.id);

    if (error) return { ok: false, error: error.message };
    return createAssignment(latest.id, accreditorIds, dueDate, siteVisitDate);
  }

  const { data: cycle } = await supabase
    .from("accreditation_cycles")
    .select("id")
    .eq("status", "open")
    .maybeSingle();

  if (!cycle) {
    return { ok: false, error: "No accreditation cycle is open yet." };
  }

  const { data: created, error } = await supabase
    .from("submissions")
    .insert({
      cycle_id: cycle.id,
      program_id: programId,
      level_id: levelId,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  return createAssignment(created.id, accreditorIds, dueDate, siteVisitDate);
}
