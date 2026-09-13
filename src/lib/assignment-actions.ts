"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEligibleAccreditors, type EligibleAccreditor } from "@/lib/assignments";
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

/**
 * QAC Personnel puts a new team on an assignment its accreditors declined.
 *
 * A replacement, not a second assignment: `assignments.submission_id` is UNIQUE,
 * so the declined row is the only row this submission will ever have, and the
 * fix is to swap its membership. The old rows go rather than being kept as
 * history — `activity_log` already records every response
 * (20260818000900_notifications_activity.sql), so the decline and its reason
 * survive the delete where a stale `rejected` row would only make the team look
 * half-refused for ever.
 *
 * Deliberately not restricted to declined assignments: an accreditor going on
 * leave mid-`assigned` is the same operation, and there is no reason to make QAC
 * wait for a formal decline first.
 */
export async function reassignAssignment(
  assignmentId: string,
  accreditorIds: string[],
): Promise<ActionResult> {
  const supabase = await createClient();

  // Client's call 2026-09-06: every assignment team is exactly 2 accreditors.
  if (accreditorIds.length !== 2) {
    return { ok: false, error: "Choose exactly 2 accreditors." };
  }

  const { data: assignment } = await supabase
    .from("assignments")
    .select("status")
    .eq("id", assignmentId)
    .maybeSingle();

  if (!assignment) return { ok: false, error: "That assignment could not be found." };
  if (!["assigned", "declined"].includes(assignment.status)) {
    return {
      ok: false,
      error: "Only an assignment that has not started yet can be reassigned.",
    };
  }

  const { error: clearError } = await supabase
    .from("assignment_accreditors")
    .delete()
    .eq("assignment_id", assignmentId);

  if (clearError) return { ok: false, error: clearError.message };

  const { error: teamError } = await supabase
    .from("assignment_accreditors")
    .insert(accreditorIds.map((id) => ({ assignment_id: assignmentId, profile_id: id })));

  if (teamError) return { ok: false, error: teamError.message };

  if (assignment.status === "declined") {
    await supabase.from("assignments").update({ status: "assigned" }).eq("id", assignmentId);
  }

  revalidatePath("/portal/assignment");
  return { ok: true };
}

/** The eligible-accreditor list for the programme behind an assignment — the
 *  reassign dialog picks from the same ranked list the create screen does, but
 *  starts from an assignment id rather than a programme it already knows. */
export async function fetchEligibleAccreditorsForAssignment(
  assignmentId: string,
): Promise<EligibleAccreditor[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("assignments")
    .select("submissions(program_id)")
    .eq("id", assignmentId)
    .maybeSingle();

  const programId = data?.submissions?.program_id;
  if (!programId) return [];

  return getEligibleAccreditors(programId);
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
 * Seed the sheet's rows from the submission's actual documents, on first
 * open — mirrors `ensureEvaluation`'s "create once" shape. There is no table
 * anywhere that says which of a submission's documents is "Narrative Report"
 * vs "Best Practice" (only `phase_document_id` XOR `requirement_area_id`, per
 * `submission_documents`' own CHECK constraint), so this maps what the schema
 * actually distinguishes: phase-linked documents seed `narrative` items,
 * requirement-area-linked documents seed `compliance_area` items, and the
 * submission's `website_url` (if set) seeds one `website` item. The frame's
 * separate "Best Practice" section has no distinct backing data to seed it
 * from and is deliberately not reproduced here — flagged rather than faked.
 */
export async function ensureEvaluationItems(
  assignmentId: string,
  evaluationId: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("evaluation_items")
    .select("id")
    .eq("evaluation_id", evaluationId)
    .limit(1);

  if (existing && existing.length > 0) return { ok: true };

  const { data: assignment } = await supabase
    .from("assignments")
    .select("submission_id")
    .eq("id", assignmentId)
    .maybeSingle();

  if (!assignment) return { ok: false, error: "That assignment could not be found." };

  const [{ data: docs }, { data: submission }] = await Promise.all([
    supabase
      .from("submission_documents")
      .select("id, title, phase_document_id, requirement_area_id")
      .eq("submission_id", assignment.submission_id)
      .eq("is_current", true),
    supabase
      .from("submissions")
      .select("website_url")
      .eq("id", assignment.submission_id)
      .maybeSingle(),
  ]);

  const rows: {
    evaluation_id: string;
    kind: "narrative" | "compliance_area" | "website";
    label: string;
    submission_document_id?: string;
    requirement_area_id?: string;
  }[] = (docs ?? []).map((d) =>
    d.requirement_area_id
      ? {
          evaluation_id: evaluationId,
          kind: "compliance_area",
          label: d.title,
          submission_document_id: d.id,
          requirement_area_id: d.requirement_area_id,
        }
      : {
          evaluation_id: evaluationId,
          kind: "narrative",
          label: d.title,
          submission_document_id: d.id,
        },
  );

  if (submission?.website_url) {
    rows.push({ evaluation_id: evaluationId, kind: "website", label: "Website" });
  }

  if (rows.length === 0) return { ok: true };

  const { error } = await supabase.from("evaluation_items").insert(rows);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Decide one item on the shared sheet.
 *
 * Last-write-wins between team members, accepted deliberately (decision 10):
 * `decided_by` / `decided_at` make it visible afterwards, and per-item granularity
 * keeps the blast radius to one row rather than the whole sheet.
 */
export async function decideItem(
  itemId: string,
  decision: "approved" | "disapproved" | "pending",
  note?: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("evaluation_items")
    .update({
      decision,
      note: note ?? null,
      decided_by: user?.id ?? null,
      decided_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/evaluation");
  return { ok: true };
}

export async function markReadyForSurveyVisit(
  assignmentId: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("assignments")
    .select("status")
    .eq("id", assignmentId)
    .maybeSingle();

  if (!assignment) return { ok: false, error: "That assignment could not be found." };
  if (!canAdvanceAssignment(assignment.status, "for_psv")) {
    return { ok: false, error: `Cannot move from ${assignment.status} to for_psv.` };
  }

  await supabase.from("assignments").update({ status: "for_psv" }).eq("id", assignmentId);
  await supabase
    .from("evaluations")
    .update({ ready_for_sv_at: new Date().toISOString() })
    .eq("assignment_id", assignmentId);

  revalidatePath("/portal/evaluation");
  return { ok: true };
}

/** The team records the verdict. It does not take effect until QAC releases it. */
export async function recordOutcome(
  assignmentId: string,
  outcome: "passed" | "failed",
  score: number | null,
  remarks: string | null,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("assignments")
    .select("status")
    .eq("id", assignmentId)
    .maybeSingle();

  if (!assignment) return { ok: false, error: "That assignment could not be found." };
  if (!canAdvanceAssignment(assignment.status, "evaluated")) {
    return { ok: false, error: `Cannot move from ${assignment.status} to evaluated.` };
  }

  const { error } = await supabase
    .from("evaluations")
    .update({
      outcome,
      score,
      remarks,
      evaluated_at: new Date().toISOString(),
    })
    .eq("assignment_id", assignmentId);

  if (error) return { ok: false, error: error.message };

  await supabase.from("assignments").update({ status: "evaluated" }).eq("id", assignmentId);

  revalidatePath("/portal/evaluation");
  return { ok: true };
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
 * The create-assignment screen's cascading campus/department/programme picker
 * is loaded once, client-side, over a bulk fetch (same reasoning as
 * `RepMapper`'s programme search — a few hundred rows, filtered in the
 * browser rather than round-tripped per keystroke). Eligible accreditors are
 * the one piece that is genuinely selection-dependent, so it stays a server
 * action re-called on each programme choice instead of being bulk-loaded for
 * all ~230 programmes up front.
 */
export async function fetchEligibleAccreditors(programId: string): Promise<EligibleAccreditor[]> {
  return getEligibleAccreditors(programId);
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
    return createAssignment(latest.id, accreditorIds, dueDate);
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
    return createAssignment(latest.id, accreditorIds, dueDate);
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

  return createAssignment(created.id, accreditorIds, dueDate);
}
