import { createClient } from "@/lib/supabase/server";
import { personName, programShort } from "@/lib/program-names";
import { SURVEY_FORMS, type Answers, type ScaleAnswer } from "@/lib/visit-evaluation-forms";

export type FbProgram = {
  assignmentId: string;
  program: string;
  short: string;
  campus: string;
  level: string;
  visit: string;
  n: number;
  m: number;
  q: number | null;
  i: number | null;
  qRows: [string, number][];
  iRows: [string, number][];
  comments: string[];
  waiting: string[];
};
export type FbAccreditor = { id: string; name: string; expertise: string[]; college: string; v: number | null; cn: number };
export type FeedbackData = { programs: FbProgram[]; accreditors: FbAccreditor[]; monthly: (number | null)[]; month: number; year: number };

const DONE = ["evaluated", "score_returned"] as const;

const EXPERTISE_MID: Record<string, number> = {
  "Exemplary (45-50)": 47.5,
  "Proficient (37-44)": 40.5,
  "Developing (25-36)": 30.5,
  "Unsatisfactory (0-24)": 12,
};

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const r1 = (x: number) => Math.round(x * 10) / 10;

const SCALES = SURVEY_FORMS.qac_service.steps.flatMap((s) => s.questions).flatMap((q) => (q.kind === "scale" ? [q] : []));

function scaleRow(a: Answers, key: string, i: number, row: string): number | null {
  const v = a[key] as ScaleAnswer | undefined;
  if (!v || typeof v !== "object") return null;
  const x = v[String(i)] ?? v[row];
  return typeof x === "number" ? x : null;
}

function iaParts(a: Answers): { ex: number; co: number; pr: number } | null {
  const ex = EXPERTISE_MID[String(a.expertise ?? "")];
  const co = Number(a.commitment);
  const pr = Number(a.professionalism);
  if (ex === undefined || !Number.isFinite(co) || !Number.isFinite(pr)) return null;
  return { ex, co, pr };
}

export async function getFeedbackData(): Promise<FeedbackData> {
  const supabase = await createClient();
  const [{ data: asgs }, { data: evals }, { data: reps }, { data: people }] = await Promise.all([
    supabase
      .from("assignments")
      .select("id, site_visit_date, updated_at, submissions!inner(program_id, programs(name, campuses(name)), accreditation_levels(name))")
      .in("status", [...DONE])
      .order("site_visit_date", { ascending: false }),
    supabase.from("visit_evaluations").select("assignment_id, evaluator_id, kind, accreditor_id, answers, submitted_at").not("submitted_at", "is", null),
    supabase.from("program_reps").select("program_id, profile_id"),
    supabase
      .from("profiles")
      .select("id, surname, given_name, middle_initial, role, is_internal_accreditor, colleges(code), accreditor_expertise(expertise_areas(name))")
      .or("role.eq.internal_accreditor,is_internal_accreditor.eq.true")
      .eq("is_active", true)
      .order("surname"),
  ]);

  const E = evals ?? [];
  const programs: FbProgram[] = (asgs ?? []).map((a) => {
    const mine = E.filter((e) => e.assignment_id === a.id);
    const qs = mine.filter((e) => e.kind === "qac_service");
    const is = mine.filter((e) => e.kind === "internal_accreditor");
    const repIds = (reps ?? []).filter((r) => r.program_id === a.submissions.program_id).map((r) => r.profile_id);
    const answered = new Set(qs.map((e) => e.evaluator_id));

    const qRows: [string, number][] = SCALES.flatMap((s) =>
      s.rows.flatMap((row, i) => {
        const v = mean(qs.map((e) => scaleRow(e.answers as Answers, s.key, i, row)).filter((x): x is number => x !== null));
        return v === null ? [] : [[row, r1(v)] as [string, number]];
      }),
    );
    const parts = is.map((e) => iaParts(e.answers as Answers)).filter((x): x is NonNullable<typeof x> => x !== null);
    const iRows: [string, number][] = parts.length
      ? [
          ["Quality of work / expertise", r1(mean(parts.map((p) => p.ex / 10))!)],
          ["Commitment / responsibility", r1(mean(parts.map((p) => p.co / 5))!)],
          ["Professionalism", r1(mean(parts.map((p) => p.pr / 5))!)],
        ]
      : [];
    const q = mean(qRows.map((r) => r[1]));
    const i = mean(parts.map((p) => (p.ex + p.co + p.pr) / 20));
    const visitDate = a.site_visit_date ?? a.updated_at;
    return {
      assignmentId: a.id,
      program: a.submissions.programs?.name ?? "—",
      short: programShort(a.submissions.programs?.name ?? ""),
      campus: a.submissions.programs?.campuses?.name ?? "—",
      level: a.submissions.accreditation_levels?.name ?? "—",
      visit: new Date(visitDate).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "Asia/Manila" }),
      n: answered.size,
      m: Math.max(repIds.length, answered.size),
      q: q === null ? null : r1(q),
      i: i === null ? null : r1(i),
      qRows,
      iRows,
      comments: mine.map((e) => String((e.answers as Answers).comments ?? "").trim()).filter(Boolean),
      waiting: repIds.filter((id) => !answered.has(id)),
    };
  });

  const accreditors: FbAccreditor[] = (people ?? []).map((p) => {
    const parts = E.filter((e) => e.kind === "internal_accreditor" && e.accreditor_id === p.id)
      .map((e) => iaParts(e.answers as Answers))
      .filter((x): x is NonNullable<typeof x> => x !== null);
    const v = mean(parts.map((x) => (x.ex + x.co + x.pr) / 20));
    return {
      id: p.id,
      name: personName(p),
      expertise: (p.accreditor_expertise ?? []).map((x) => x.expertise_areas?.name).filter((x): x is string => Boolean(x)),
      college: p.colleges?.code ?? "—",
      v: v === null ? null : r1(v),
      cn: parts.length,
    };
  });

  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const year = now.getFullYear();
  const byMonth: number[][] = Array.from({ length: 12 }, () => []);
  for (const e of E) {
    if (e.kind !== "qac_service" || !e.submitted_at) continue;
    const d = new Date(new Date(e.submitted_at).toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    if (d.getFullYear() !== year) continue;
    const v = mean(SCALES.flatMap((s) => s.rows.map((row, i) => scaleRow(e.answers as Answers, s.key, i, row))).filter((x): x is number => x !== null));
    if (v !== null) byMonth[d.getMonth()].push(v);
  }
  const monthly = byMonth.map((xs) => {
    const v = mean(xs);
    return v === null ? null : r1(v);
  });

  return { programs, accreditors, monthly, month: now.getMonth(), year };
}
