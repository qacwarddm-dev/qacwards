import { createClient } from "@/lib/supabase/server";
import { getMyPrograms } from "@/lib/submissions";
import { allPhaseSlots, countSlots, emptyReview, getReferenceStructure, getSubmissionReviews, includedAreas, missingChoices } from "@/lib/reviews";
import { manilaDay, personName, programMid, programShort } from "@/lib/program-names";
import { acceptsWork } from "@/lib/cycle";
import type { RepProgram } from "@/lib/rep-model";
import type { TemplateFile } from "@/components/portal/kit/UploadFlow";
export * from "@/lib/rep-model";
import type { CalEvent } from "@/components/portal/kit/calendar";
import type { EventExtra } from "@/components/portal/screens/EventsScreen";

type TeamRow = { response: string; is_team_leader: boolean; profiles: { surname: string; given_name: string; middle_initial: string | null } | null };

const SHORT: Record<string, string> = { PSV: "PSV", I: "LEVEL I", II: "LEVEL II", III: "LEVEL III", IV: "LEVEL IV" };

/** Every programme the rep holds, each with its five levels and, where a
 *  submission exists, the full document review for it. */
export async function getRepPrograms(): Promise<RepProgram[]> {
  const programs = await getMyPrograms();
  if (!programs.length) return [];
  const supabase = await createClient();
  const [{ data: levels }, { data: subs }, { data: awards }, { data: openCycle }] = await Promise.all([
    supabase.from("accreditation_levels").select("id, code, name, ordinal").order("ordinal"),
    supabase
      .from("submissions")
      .select("id, program_id, level_id, status, attempt, accreditation_cycles!submissions_cycle_id_fkey(status, end_date), assignments(id, evaluations(outcome, released_at), assignment_accreditors(profile_id, response, is_team_leader, profiles(surname, given_name, middle_initial)))")
      .in("program_id", programs.map((p) => p.id))
      .order("attempt", { ascending: false }),
    supabase
      .from("program_accreditations")
      .select("program_id, status, accreditation_levels!level_id(code)")
      .in("program_id", programs.map((p) => p.id))
      .in("status", ["active", "superseded"]),
    supabase.from("accreditation_cycles").select("status, end_date").eq("status", "open").maybeSingle(),
  ]);
  const today = manilaDay();
  const live = acceptsWork(openCycle, today);
  const latest = new Map<string, { id: string; status: string; closed: boolean; accreditors: { name: string; accepted: boolean; leader: boolean }[]; result: string | null }>();
  for (const s of subs ?? []) {
    const k = `${s.program_id}|${s.level_id}`;
    const asg = Array.isArray(s.assignments) ? s.assignments[0] : s.assignments;
    const team = (asg?.assignment_accreditors ?? []) as TeamRow[];
    const accreditors = team
      .filter((a) => a.response !== "rejected")
      .map((a) => ({ name: a.profiles ? personName(a.profiles) : "—", accepted: a.response === "accepted", leader: a.is_team_leader }))
      .sort((a, b) => Number(b.leader) - Number(a.leader));
    const evaluation = asg ? (Array.isArray(asg.evaluations) ? asg.evaluations[0] : asg.evaluations) : null;
    const result = evaluation?.released_at && evaluation.outcome ? (evaluation.outcome === "passed" ? "Passed" : "Deferred") : null;
    if (!latest.has(k)) latest.set(k, { id: s.id, status: s.status, closed: !acceptsWork(s.accreditation_cycles, today), accreditors, result });
  }
  const submissionIds = [...latest.values()].map((s) => s.id);
  const [reviews, ref, { data: acks }] = await Promise.all([
    getSubmissionReviews(submissionIds),
    getReferenceStructure(),
    submissionIds.length ? supabase.rpc("submission_report_acknowledged", { p_submissions: submissionIds }) : Promise.resolve({ data: [] as { submission_id: string; acknowledged: boolean }[] }),
  ]);
  const acknowledged = new Set((acks ?? []).filter((a) => a.acknowledged).map((a) => a.submission_id));
  return programs.map((p) => {
    const awarded = (awards ?? [])
      .filter((a) => a.program_id === p.id)
      .map((a) => a.accreditation_levels?.code)
      .filter((c): c is string => Boolean(c));
    return {
      id: p.id,
      name: p.label,
      campus: p.campus,
      college: p.college,
      psvPassed: awarded.includes("PSV"),
      awarded,
      levels: (levels ?? []).map((l) => {
        const s = latest.get(`${p.id}|${l.id}`) ?? null;
        return {
          levelId: l.id,
          code: l.code,
          name: l.name,
          short: SHORT[l.code] ?? l.code,
          ordinal: l.ordinal,
          submissionId: s?.id ?? null,
          status: s?.status ?? null,
          closed: s?.closed ?? !live,
          accreditors: s?.accreditors ?? [],
          reportAcknowledged: s ? acknowledged.has(s.id) : false,
          result: s?.result ?? null,
          review: s
            ? (reviews.find((r) => r.submissionId === s.id) ?? null)
            : emptyReview(ref, { id: l.id, code: l.code, name: l.name, required_choices: ref.levels.find((x) => x.id === l.id)?.required_choices ?? null }, {
                id: p.id,
                name: p.label,
                mid: programMid(p.label),
                short: programShort(p.label),
                campus: p.campus ?? "—",
                college: p.college ?? "—",
                collegeName: p.college ?? "—",
              }),
        };
      }),
    };
  });
}

export async function getRepEventExtras(events: CalEvent[]): Promise<Record<string, EventExtra[]>> {
  const out: Record<string, EventExtra[]> = {};
  const deadlines = events.filter((e) => e.id.startsWith("deadline:"));
  if (!deadlines.length) return out;
  const supabase = await createClient();
  const { data: asg } = await supabase
    .from("assignments")
    .select("id, submission_id")
    .in("id", deadlines.map((e) => e.id.slice("deadline:".length)));
  const reviews = await getSubmissionReviews((asg ?? []).map((a) => a.submission_id));
  for (const e of deadlines) {
    const a = (asg ?? []).find((x) => `deadline:${x.id}` === e.id);
    const r = reviews.find((x) => x.submissionId === a?.submission_id);
    if (!r) continue;
    const c = countSlots([...allPhaseSlots(r), ...includedAreas(r)], missingChoices(r));
    if (!c.miss) continue;
    out[e.id] = [
      {
        icon: "⬆",
        title: `${c.miss} ${r.levelName} documents still to upload`,
        sub: "Finish them before the deadline.",
        action: "Go",
        href: `/portal/submission?program=${r.program.id}&level=${r.levelId}`,
      },
    ];
  }
  return out;
}

/** The downloadable PUP Document Template every upload form offers. */
export async function getGeneralTemplate(): Promise<TemplateFile> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("templates")
    .select("id, title, storage_path, group_key, requirement_area_id, phase_document_id")
    .eq("is_published", true)
    .order("updated_at", { ascending: false });
  const link = (t: { id: string; storage_path: string }): { name: string; url: string } => {
    const file = t.storage_path.split("/").pop() ?? "";
    return { name: file.includes(".") ? file : "PUP-Document-Toolkit.docx", url: `/api/documents/download?source=template&id=${t.id}&download=1` };
  };
  const rows = data ?? [];
  const general = rows.find((t) => t.group_key === "gen" || /PUP Document (Template|Toolkit)/i.test(t.title));
  const byRef: Record<string, { name: string; url: string }> = {};
  for (const t of rows) {
    const ref = t.requirement_area_id ?? t.phase_document_id;
    if (ref && !byRef[ref]) byRef[ref] = link(t);
  }
  return { ...(general ? link(general) : { name: "PUP-Document-Toolkit.docx", url: null }), byRef };
}

/** level id → visit date label, for levels whose survey visit already happened. */
export async function getVisitLabels(programs: RepProgram[]): Promise<Record<string, string>> {
  const subs = programs.flatMap((p) => p.levels.filter((l) => l.submissionId && p.awarded.includes(l.code)).map((l) => l.submissionId!));
  if (!subs.length) return {};
  const supabase = await createClient();
  const { data } = await supabase.from("assignments").select("submission_id, site_visit_date").in("submission_id", subs);
  const out: Record<string, string> = {};
  const { shortDate } = await import("@/lib/program-names");
  for (const p of programs)
    for (const l of p.levels) {
      const a = (data ?? []).find((x) => x.submission_id === l.submissionId);
      if (a?.site_visit_date) out[l.levelId] = shortDate(a.site_visit_date);
    }
  return out;
}
