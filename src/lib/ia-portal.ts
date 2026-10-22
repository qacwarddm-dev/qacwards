import { createClient } from "@/lib/supabase/server";
import { getSubmissionReviews, getTeamRatings } from "@/lib/reviews";
import type { IaAssignment, ReportState } from "@/lib/ia-model";
export * from "@/lib/ia-model";
import { initialsOf, personName, programMid, programShort, shortDate } from "@/lib/program-names";
import type { TeamRole } from "@/lib/team-model";

function visitRange(date: string | null) {
  if (!date) return "Not scheduled";
  return shortDate(date);
}

export async function getIaAssignments(viewerId: string): Promise<IaAssignment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assignments")
    .select(
      `id, status, due_date, site_visit_date, submission_id, leader_area_ids,
       submissions(id, level_id, program_id, programs(id, name, campuses(name), colleges(code, name)), accreditation_levels(code, name)),
       assignment_accreditors(profile_id, response, is_team_leader, areas_sent_at, profiles(surname, given_name, middle_initial))`,
    )
    .order("created_at", { ascending: false });

  const mine = (data ?? []).filter((a) => (a.assignment_accreditors ?? []).some((m) => m.profile_id === viewerId));
  const accepted = mine.filter((a) => a.assignment_accreditors.find((m) => m.profile_id === viewerId)?.response === "accepted");

  const [reviews, { data: reports }, { data: awards }] = await Promise.all([
    getSubmissionReviews(accepted.map((a) => a.submission_id)),
    mine.length
      ? supabase
          .from("accreditor_reports")
          .select("assignment_id, accreditor_id, status, overall_findings, recommendation, signed_at, doc_code, grand_mean, qac_note")
          .in("assignment_id", mine.map((a) => a.id))
      : Promise.resolve({ data: [] as never[] }),
    supabase
      .from("program_accreditations")
      .select("program_id, accreditation_levels!level_id(code)")
      .in("program_id", mine.map((a) => a.submissions?.program_id ?? ""))
      .in("status", ["active", "superseded"]),
  ]);

  const toReport = (r: NonNullable<typeof reports>[number] | undefined): ReportState | null =>
    r
      ? {
          status: r.status as ReportState["status"],
          findings: r.overall_findings ?? "",
          recommendation: r.recommendation ?? "",
          signedAt: r.signed_at,
          code: r.doc_code,
          grandMean: r.grand_mean,
          qacNote: r.qac_note,
        }
      : null;

  return Promise.all(
    mine.map(async (a) => {
      const s = a.submissions;
      const p = s?.programs;
      const me = a.assignment_accreditors.find((m) => m.profile_id === viewerId);
      const myResponse = me?.response ?? "pending";
      const review = reviews.find((r) => r.submissionId === a.submission_id) ?? null;
      const leader = a.assignment_accreditors.find((m) => m.is_team_leader) ?? null;
      const assistant = a.assignment_accreditors.find((m) => !m.is_team_leader && m.response !== "rejected") ?? null;
      const role: TeamRole = me?.is_team_leader || !leader ? "leader" : "assistant";
      const mateRow = role === "leader" ? assistant : leader;
      const mateName = mateRow ? personName(mateRow.profiles) : "";
      const areaIds = review?.areas.map((x) => x.refId) ?? [];
      const mineIds = leader ? areaIds.filter((id) => a.leader_area_ids.includes(id) === (role === "leader")) : areaIds;
      const ownerOf = (areaId: string) => (leader ? ((a.leader_area_ids.includes(areaId) ? leader.profile_id : assistant?.profile_id) ?? null) : null);
      const team = myResponse === "accepted" ? await getTeamRatings(a.id, ownerOf) : { ratings: {}, comments: {} };
      return {
        id: a.id,
        status: a.status,
        submissionId: a.submission_id,
        programId: p?.id ?? "",
        program: p?.name ?? "—",
        mid: programMid(p?.name ?? "—"),
        short: programShort(p?.name ?? "—"),
        campus: p?.campuses?.name ?? "—",
        college: p?.colleges?.code ?? "—",
        collegeName: p?.colleges?.name ?? "Campus programs",
        levelId: s?.level_id ?? "",
        levelCode: s?.accreditation_levels?.code ?? "",
        levelName: s?.accreditation_levels?.name ?? "—",
        visit: a.site_visit_date,
        visitLabel: visitRange(a.site_visit_date),
        due: a.due_date,
        myResponse,
        team: a.assignment_accreditors.map((m) => {
          const name = personName(m.profiles);
          return {
            id: m.profile_id,
            name,
            initials: initialsOf(name),
            response: m.response,
            me: m.profile_id === viewerId,
            leader: m.is_team_leader,
            sentAt: m.areas_sent_at,
            report: toReport((reports ?? []).find((r) => r.assignment_id === a.id && r.accreditor_id === m.profile_id)),
          };
        }),
        role,
        mine: mineIds,
        leaderAreaIds: a.leader_area_ids,
        mate: mateRow ? { id: mateRow.profile_id, name: mateName, short: mateName.split(",")[0], response: mateRow.response } : null,
        mySentAt: me?.areas_sent_at ?? null,
        mateSentAt: role === "leader" ? (assistant?.areas_sent_at ?? null) : null,
        review,
        ratings: team.ratings,
        comments: team.comments,
        report: toReport((reports ?? []).find((r) => r.assignment_id === a.id && r.accreditor_id === leader?.profile_id)),
        awardedCodes: (awards ?? [])
          .filter((w) => w.program_id === p?.id)
          .map((w) => w.accreditation_levels?.code)
          .filter((c): c is string => Boolean(c)),
      } satisfies IaAssignment;
    }),
  );
}

