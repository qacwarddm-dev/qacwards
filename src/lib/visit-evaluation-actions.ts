"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";
import { getCompletedVisits, targetKey } from "@/lib/visit-evaluations";
import {
  SURVEY_FORMS,
  formProblems,
  sanitizeAnswers,
  type Answers,
  type VisitEvaluationKind,
} from "@/lib/visit-evaluation-forms";

export type SaveResult = { ok: true; submittedAt: string | null } | { ok: false; error: string };

// The target is resolved through `getCompletedVisits()` rather than trusted
// from the client: that is what proves the accreditor really served on the
// visit. RLS only checks the programme and the visit's status.
export async function saveVisitEvaluation(input: {
  assignmentId: string;
  kind: VisitEvaluationKind;
  accreditorId: string | null;
  answers: Answers;
  submit: boolean;
}): Promise<SaveResult> {
  const form = SURVEY_FORMS[input.kind];
  if (!form) return { ok: false, error: "Unknown evaluation." };

  const visits = await getCompletedVisits();
  const visit = visits.find((v) => v.assignmentId === input.assignmentId);
  const key = targetKey(input.assignmentId, input.kind, input.accreditorId);
  const target = visit?.targets.find((t) => t.key === key);
  if (!visit || !target) return { ok: false, error: "That evaluation is not open to you." };
  if (target.status === "submitted") return { ok: false, error: "That evaluation was already submitted." };

  const answers = sanitizeAnswers(form, input.answers);
  if (input.submit) {
    const problems = formProblems(form, answers);
    if (problems.length > 0) {
      return { ok: false, error: `${problems.length} question${problems.length === 1 ? " is" : "s are"} still unanswered.` };
    }
  }

  const now = new Date().toISOString();
  const stored = (
    input.submit ? { ...answers, auto: { ...visit.auto, accreditor: target.who } } : answers
  ) as Json;
  const patch = { answers: stored, updated_at: now, submitted_at: input.submit ? now : null };

  const supabase = await createClient();
  const lookup = supabase
    .from("visit_evaluations")
    .select("id")
    .eq("assignment_id", input.assignmentId)
    .eq("kind", input.kind);
  const { data: existing } = await (input.accreditorId
    ? lookup.eq("accreditor_id", input.accreditorId)
    : lookup.is("accreditor_id", null)
  ).maybeSingle();

  const { error } = existing
    ? await supabase.from("visit_evaluations").update(patch).eq("id", existing.id)
    : await supabase.from("visit_evaluations").insert({
        assignment_id: input.assignmentId,
        kind: input.kind,
        accreditor_id: input.accreditorId,
        ...patch,
      });

  if (error) return { ok: false, error: "Your answers could not be saved. Try again in a moment." };

  if (input.submit) revalidatePath("/portal", "layout");
  return { ok: true, submittedAt: input.submit ? now : null };
}
