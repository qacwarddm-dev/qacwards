import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { getMyPrograms } from "@/lib/submissions";
import {
  visitLabelForLevel,
  type Answers,
  type AutoValues,
  type VisitEvaluationKind,
} from "@/lib/visit-evaluation-forms";

export type EvaluationTarget = {
  key: string;
  assignmentId: string;
  kind: VisitEvaluationKind;
  accreditorId: string | null;
  who: string;
  status: "pending" | "draft" | "submitted";
  answers: Answers;
  submittedAt: string | null;
};

export type CompletedVisit = {
  assignmentId: string;
  programSlug: string;
  programLabel: string;
  visitLabel: string;
  nextLevel: string | null;
  auto: Omit<AutoValues, "accreditor">;
  targets: EvaluationTarget[];
};

const SURVEYED_LEVEL = "PSV";
const DONE_STATUSES = ["evaluated", "score_returned"] as const;

export function targetKey(assignmentId: string, kind: VisitEvaluationKind, accreditorId: string | null) {
  return `${assignmentId}:${kind}:${accreditorId ?? "qac"}`;
}

function personName(p: { surname: string; given_name: string; middle_initial: string | null }) {
  const mi = p.middle_initial ? ` ${p.middle_initial.replace(/\.?$/, ".")}` : "";
  return `${p.given_name}${mi} ${p.surname}`;
}

export function todayLong(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
}

// `site_visit_date` is deliberately not selected: that column arrives with an
// unapplied migration, and selecting it would blank this list.
export async function getCompletedVisits(): Promise<CompletedVisit[]> {
  const [user, programs] = await Promise.all([getCurrentUser(), getMyPrograms()]);
  if (!user || user.role !== "program_representative" || programs.length === 0) return [];

  const supabase = await createClient();
  const { data: assignments } = await supabase
    .from("assignments")
    .select(
      `id, status, updated_at,
       submissions!inner(program_id, accreditation_levels!inner(code, ordinal)),
       evaluations(outcome),
       assignment_accreditors(profile_id, response, profiles(surname, given_name, middle_initial))`,
    )
    .in("status", [...DONE_STATUSES])
    .in(
      "submissions.program_id",
      programs.map((p) => p.id),
    )
    .eq("submissions.accreditation_levels.code", SURVEYED_LEVEL)
    .order("updated_at", { ascending: false });

  const visits = (assignments ?? []).filter((a) => a.evaluations?.outcome !== "failed");
  if (visits.length === 0) return [];

  const [{ data: levels }, { data: rows, error: rowsError }] = await Promise.all([
    supabase.from("accreditation_levels").select("name, ordinal").order("ordinal"),
    supabase
      .from("visit_evaluations")
      .select("assignment_id, kind, accreditor_id, answers, submitted_at")
      .eq("evaluator_id", user.id)
      .in(
        "assignment_id",
        visits.map((v) => v.id),
      ),
  ]);

  // Until 20260927000300_visit_evaluations.sql is applied there is nowhere to
  // save answers, so the prompt stays dormant rather than inviting a form
  // that cannot be submitted.
  if (rowsError) return [];

  const saved = new Map(
    (rows ?? []).map((r) => [
      targetKey(r.assignment_id, r.kind as VisitEvaluationKind, r.accreditor_id),
      r,
    ]),
  );

  return visits.map((a) => {
    const program = programs.find((p) => p.id === a.submissions.program_id)!;
    const ordinal = a.submissions.accreditation_levels.ordinal;
    const next = (levels ?? []).find((l) => l.ordinal > ordinal);

    const team = (a.assignment_accreditors ?? [])
      .filter((m) => m.response === "accepted" && m.profiles)
      .map((m) => ({ id: m.profile_id, name: personName(m.profiles!) }));

    const target = (kind: VisitEvaluationKind, accreditorId: string | null, who: string): EvaluationTarget => {
      const key = targetKey(a.id, kind, accreditorId);
      const row = saved.get(key);
      return {
        key,
        assignmentId: a.id,
        kind,
        accreditorId,
        who,
        status: row?.submitted_at ? "submitted" : row ? "draft" : "pending",
        answers: (row?.answers as Answers | undefined) ?? {},
        submittedAt: row?.submitted_at ?? null,
      };
    };

    return {
      assignmentId: a.id,
      programSlug: program.slug,
      programLabel: program.label,
      visitLabel: visitLabelForLevel(SURVEYED_LEVEL),
      nextLevel: next?.name ?? null,
      auto: {
        email: user.webmail,
        evaluator: user.name,
        designation: user.position,
        campus: program.campus ?? "",
        program: [program.label, program.college, program.campus].filter(Boolean).join(" / "),
        date: todayLong(),
      },
      targets: [
        target("qac_service", null, "Quality Assurance Center"),
        ...team.map((m) => target("internal_accreditor", m.id, m.name)),
      ],
    };
  });
}
