import { createClient } from "@/lib/supabase/server";
import { getRequirementAreas } from "@/lib/submissions";
import { relevantExpertise } from "@/lib/expertise-disciplines";
import { asOfNow } from "@/lib/dashboards";
import type { Stat } from "@/components/portal/kit";

/**
 * Reads behind `/portal/assignment` and `/portal/evaluation`.
 *
 * Scoped by RLS, not by filters here: an accreditor sees the assignments they are
 * on because `my_assignment_ids()` is a predicate on the policy, and QAC sees all
 * of them because a second policy says so. The queries look unguarded and are not.
 */

export type EligibleAccreditor = {
  id: string;
  name: string;
  webmail: string;
  /** Expertise areas this accreditor holds that qualify them for the
   *  programme (`relevantExpertise`). */
  matched: string[];
  /** Everything they hold, qualifying areas first — the picker's Expertise column. */
  expertise: string[];
  expertiseCount: number;
  /** Owner decision 2026-08-22: QAC Personnel may be assigned as the internal
   *  accreditor of last resort when nobody eligible matches. They rank below
   *  every real accreditor, badged in the picker so the choice is explicit.
   *
   *  Round 2 §2 gives that arrangement a formal form — a QAC Personnel the QAC
   *  Admin has flagged as also acting as an Internal Accreditor is not a last
   *  resort and is not badged as one, so this stays false for them. */
  isQacStaff: boolean;
};

/**
 * Accreditors who could evaluate a programme, best match first.
 *
 * docs/qac_per.pdf: the Eligible Accreditors list is generated from the
 * accreditors' expertise. An accreditor is eligible when they hold at least one
 * area `relevantExpertise` qualifies for the programme's title. The rest are
 * still returned, after the eligible ones, so the picker can offer them behind
 * a "show all" — QAC keeps the final say, and the owner's 2026-08-22 fallback
 * (a QAC Personnel taking an assignment nobody matches) needs them reachable.
 */
export async function getEligibleAccreditors(
  programId: string,
): Promise<EligibleAccreditor[]> {
  const supabase = await createClient();

  const [{ data: program }, { data: accreditors }] = await Promise.all([
    supabase.from("programs").select("name").eq("id", programId).maybeSingle(),
    supabase
      .from("profiles")
      .select(
        "id, surname, given_name, webmail, role, is_internal_accreditor, accreditor_expertise(expertise_areas(name))",
      )
      // The accreditor role, the QAC Personnel fallback, and — round 2 §2 —
      // anyone the QAC Admin flagged as also acting as an accreditor, whatever
      // their own role is. Filtering on role alone would hide the very people
      // the flag exists to make assignable.
      .or("role.in.(internal_accreditor,qac_personnel),is_internal_accreditor.eq.true")
      .eq("is_active", true)
      .order("surname"),
  ]);

  const rows = (accreditors ?? []).map((a) => ({
    a,
    areas: (a.accreditor_expertise ?? [])
      .map((row) => row.expertise_areas?.name)
      .filter((n): n is string => Boolean(n)),
  }));
  const relevant = relevantExpertise(
    program?.name ?? "",
    [...new Set(rows.flatMap((r) => r.areas))],
  );

  return rows
    .map(({ a, areas }) => {
      const matched = areas.filter((area) => relevant.has(area));
      return {
        id: a.id,
        name: `${a.surname}, ${a.given_name}`,
        webmail: a.webmail,
        matched,
        expertise: [...matched, ...areas.filter((area) => !relevant.has(area))],
        expertiseCount: areas.length,
        isQacStaff: a.role === "qac_personnel" && !a.is_internal_accreditor,
      };
    })
    .sort(
      (a, b) =>
        Number(a.isQacStaff) - Number(b.isQacStaff) ||
        b.matched.length - a.matched.length ||
        a.name.localeCompare(b.name),
    );
}

export type AssignmentRow = {
  id: string;
  status: string;
  dueDate: string | null;
  siteVisitDate: string | null;
  program: string;
  campus: string;
  college: string;
  level: string;
  team: { id: string; name: string; response: string; note: string | null }[];
  myResponse: string | null;
  /** Joined team member names, "—" when the team has none. Used by the QAC
   *  Personnel list, which shows one accreditor cell rather than per-member rows. */
  accreditor: string;
  score: string;
  /** Round 2 §1 — what the QAC Personnel queue needs to know at a glance: how
   *  the invitations went, and whether this row is waiting on them to act. */
  responses: { pending: number; accepted: number; rejected: number };
  /** A team that is short an accreditor: every member declined, or some did and
   *  the rest have not started. QAC reassigns from the list, so this is what
   *  raises the Reassign affordance rather than `status === "declined"` alone —
   *  a partial refusal never changes the status but still leaves a hole. */
  needsReassignment: boolean;
};

export async function getAssignments(viewerId: string): Promise<AssignmentRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("assignments")
    .select(
      `id, status, due_date, site_visit_date,
       submissions(accreditation_levels(name),
                   programs(name, campuses(name), colleges(code))),
       assignment_accreditors(profile_id, response, rejection_note, profiles(surname, given_name)),
       evaluations(score, outcome, released_at)`,
    )
    .order("created_at", { ascending: false });

  return (data ?? []).map((a) => {
    const team = (a.assignment_accreditors ?? []).map((m) => ({
      id: m.profile_id,
      name: m.profiles ? `${m.profiles.surname}, ${m.profiles.given_name}` : "—",
      response: m.response,
      note: m.rejection_note,
    }));

    const responses = {
      pending: team.filter((m) => m.response === "pending").length,
      accepted: team.filter((m) => m.response === "accepted").length,
      rejected: team.filter((m) => m.response === "rejected").length,
    };

    return {
      id: a.id,
      status: a.status,
      dueDate: a.due_date,
      siteVisitDate: a.site_visit_date,
      program: a.submissions?.programs?.name ?? "—",
      campus: a.submissions?.programs?.campuses?.name ?? "—",
      // Off-main-campus programmes genuinely have no college, so the dash here
      // is the real answer rather than missing data.
      college: a.submissions?.programs?.colleges?.code ?? "—",
      level: a.submissions?.accreditation_levels?.name ?? "—",
      team,
      myResponse: team.find((m) => m.id === viewerId)?.response ?? null,
      accreditor: team.map((m) => m.name).join("; ") || "—",
      score: scoreDisplay(a.evaluations ?? null),
      responses,
      needsReassignment:
        a.status === "declined" || (responses.rejected > 0 && responses.accepted === 0),
    };
  });
}

/**
 * The shared evaluation sheet for one assignment, with its items.
 *
 * A document's review state is read from `evaluation_items.decision` joined back
 * to the document — there is deliberately no status column on
 * `submission_documents` to disagree with it (§2.3).
 */
export async function getEvaluation(assignmentId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("evaluations")
    .select(
      `id, score, outcome, compliance_status, remarks,
       ready_for_sv_at, evaluated_at, released_at,
       evaluation_items(id, kind, label, decision, score, note,
                        submission_document_id, requirement_area_id)`,
    )
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  return data;
}

export function scoreDisplay(evaluation: {
  score: number | null;
  outcome: string | null;
  released_at: string | null;
} | null): string {
  if (!evaluation?.released_at) return "Not yet released";
  if (evaluation.score != null) return String(evaluation.score);
  return evaluation.outcome ?? "Released";
}

/** Behind `/portal/evaluation/[id]` — one assignment's identifying details.
 *  Item-level data (the sheet itself) stays on `getEvaluation`. */
export type AssignmentDetail = {
  id: string;
  status: string;
  campus: string;
  college: string;
  program: string;
  level: string;
  accreditor: string;
  websiteUrl: string | null;
  /** The caller's own invitation, or null when they are not on the team at all
   *  (QAC reading someone else's assignment). Round 2 §1: the sheet is gated on
   *  this being `accepted` for the people who were actually invited. */
  myResponse: string | null;
  /** The team as people, for the sign-off block — round 2 §4 prints who signed
   *  rather than a joined string of names. */
  signatories: { id: string; name: string; response: string; note: string | null }[];
  /** Needed to pull that submission's requirement areas / readiness — not
   *  displayed, so kept out of every existing render's props by staying at
   *  the end. Null only if the assignment's submission was deleted. */
  submissionId: string | null;
  levelId: string | null;
  programId: string | null;
  levelCode: string | null;
  /** "College/Branch" on the sheet: the college's full name, or the campus
   *  for an off-main-campus programme that has none. */
  branch: string;
  submissionStatus: string | null;
  /** `YYYY-MM-DD`, Manila calendar day — the Evaluate button's unlock date. */
  siteVisitDate: string | null;
  dueDate: string | null;
};

export async function getAssignmentDetail(assignmentId: string): Promise<AssignmentDetail | null> {
  const supabase = await createClient();

  const [{ data }, { data: auth }] = await Promise.all([
    supabase
      .from("assignments")
      .select(
        `id, status, submission_id, site_visit_date, due_date,
         submissions(status, website_url, level_id, programs(id, name, campuses(name), colleges(code, name)), accreditation_levels(code, name)),
         assignment_accreditors(profile_id, response, rejection_note, profiles(surname, given_name))`,
      )
      .eq("id", assignmentId)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (!data) return null;

  const signatories = (data.assignment_accreditors ?? []).map((m) => ({
    id: m.profile_id,
    name: m.profiles ? `${m.profiles.surname}, ${m.profiles.given_name}` : "—",
    response: m.response,
    note: m.rejection_note,
  }));

  return {
    id: data.id,
    status: data.status,
    campus: data.submissions?.programs?.campuses?.name ?? "—",
    college: data.submissions?.programs?.colleges?.code ?? "—",
    program: data.submissions?.programs?.name ?? "—",
    level: data.submissions?.accreditation_levels?.name ?? "—",
    accreditor: signatories.map((m) => m.name).join("; ") || "—",
    websiteUrl: data.submissions?.website_url ?? null,
    myResponse: signatories.find((m) => m.id === auth.user?.id)?.response ?? null,
    signatories,
    submissionId: data.submission_id,
    levelId: data.submissions?.level_id ?? null,
    programId: data.submissions?.programs?.id ?? null,
    levelCode: data.submissions?.accreditation_levels?.code ?? null,
    branch:
      data.submissions?.programs?.colleges?.name ??
      data.submissions?.programs?.campuses?.name ??
      "—",
    submissionStatus: data.submissions?.status ?? null,
    siteVisitDate: data.site_visit_date,
    dueDate: data.due_date,
  };
}

/** Behind `/portal/evaluation/[id]` — the Areas grid that now fronts the
 *  sheet (client revision, same situation as `InternalAccreditorEvaluation`).
 *  `readiness` is the same `submission_readiness` number the Programs list
 *  already shows for this assignment; areas reuse the Program Rep's own
 *  `getRequirementAreas` query verbatim — same table, same shape. */
export type AssignmentRequirements = {
  detail: AssignmentDetail;
  areas: { id: string; name: string; isOptional: boolean; uploaded: boolean; chosen: boolean }[];
  readiness: number;
};

export async function getAssignmentRequirements(
  assignmentId: string,
): Promise<AssignmentRequirements | null> {
  const supabase = await createClient();
  const detail = await getAssignmentDetail(assignmentId);
  if (!detail) return null;

  const [areas, { data: readinessRow }] = await Promise.all([
    detail.levelId ? getRequirementAreas(detail.levelId, detail.submissionId) : [],
    detail.submissionId
      ? supabase
          .from("submission_readiness")
          .select("readiness_percent")
          .eq("submission_id", detail.submissionId)
          .maybeSingle()
      : Promise.resolve({ data: null as { readiness_percent: number | null } | null }),
  ]);

  return { detail, areas, readiness: readinessRow?.readiness_percent ?? 0 };
}

export type AreaDocument = {
  id: string;
  title: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
  version: number;
};

/** The programme's current files for one requirement area — what the
 *  accreditor opens from an Area row. Read-only: "documents follow their
 *  submission" already lets the team read them. */
export async function getAreaDocuments(
  submissionId: string,
  requirementAreaId: string,
): Promise<AreaDocument[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("submission_documents")
    .select("id, title, file_size, uploaded_at, version, profiles(surname, given_name)")
    .eq("submission_id", submissionId)
    .eq("requirement_area_id", requirementAreaId)
    .eq("is_current", true)
    .order("uploaded_at", { ascending: false });

  return (data ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    fileSize: d.file_size,
    uploadedAt: d.uploaded_at,
    uploadedBy: d.profiles ? `${d.profiles.surname}, ${d.profiles.given_name}` : "—",
    version: d.version,
  }));
}

export type SubmissionReturn = {
  note: string;
  createdAt: string;
  returnedBy: string;
};

export async function getLatestReturn(submissionId: string): Promise<SubmissionReturn | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("submission_returns")
    .select("note, created_at, profiles(surname, given_name)")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    note: data.note,
    createdAt: data.created_at,
    returnedBy: data.profiles ? `${data.profiles.given_name} ${data.profiles.surname}` : "—",
  };
}

export type EvaluationSheetState = {
  values: Record<string, string>;
  updatedAt: string | null;
  updatedBy: string | null;
  evaluatedAt: string | null;
};

export async function getEvaluationSheet(assignmentId: string): Promise<EvaluationSheetState> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("evaluations")
    .select("sheet, sheet_updated_at, evaluated_at, profiles!sheet_updated_by(surname, given_name)")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  const raw = (data?.sheet ?? {}) as Record<string, unknown>;
  const values = Object.fromEntries(
    Object.entries(raw).filter((e): e is [string, string] => typeof e[1] === "string"),
  );

  return {
    values,
    updatedAt: data?.sheet_updated_at ?? null,
    updatedBy: data?.profiles ? `${data.profiles.given_name} ${data.profiles.surname}` : null,
    evaluatedAt: data?.evaluated_at ?? null,
  };
}

export type AccreditationProgramRow = {
  id: string;
  program: string;
  campus: string;
  level: string;
  levelCode: string | null;
  accreditor: string;
  readiness: number;
};

export type AccreditationOverview = {
  summary: Stat[];
  programs: AccreditationProgramRow[];
  campuses: string[];
  levels: string[];
};

/** "PSV" rather than "Preliminary Survey Visit" — the long name does not fit a
 *  list column, and the summary tile already reads PSV. */
export function shortLevel(code: string | null | undefined, name: string | null | undefined) {
  return code === "PSV" ? "PSV" : (name ?? "—");
}

/**
 * QAC Personnel → Accreditation (docs/qac_per.pdf): one row per assignment —
 * the programme, its campus and level, the team, and the same
 * `submission_readiness` number every other readiness bar reads. The summary
 * counts those rows by level, so a tile always equals what the Level filter
 * would show under it.
 */
export async function getAccreditationOverview(): Promise<AccreditationOverview> {
  const supabase = await createClient();

  const [{ data: assignments }, { data: campuses }, { data: levels }] = await Promise.all([
    supabase
      .from("assignments")
      .select(
        `id, submission_id,
         submissions(programs(name, campuses(name)), accreditation_levels(code, name)),
         assignment_accreditors(profiles(surname, given_name))`,
      )
      .order("created_at", { ascending: false }),
    supabase.from("campuses").select("name").order("name"),
    supabase.from("accreditation_levels").select("code, name").order("ordinal"),
  ]);

  const submissionIds = (assignments ?? [])
    .map((a) => a.submission_id)
    .filter((id): id is string => Boolean(id));

  const { data: readinessRows } = submissionIds.length
    ? await supabase
        .from("submission_readiness")
        .select("submission_id, readiness_percent")
        .in("submission_id", submissionIds)
    : { data: [] as { submission_id: string | null; readiness_percent: number | null }[] };

  const readiness = new Map(
    (readinessRows ?? []).map((r) => [r.submission_id, r.readiness_percent ?? 0]),
  );

  const programs = (assignments ?? []).map((a) => {
    const level = a.submissions?.accreditation_levels;
    return {
      id: a.id,
      program: a.submissions?.programs?.name ?? "—",
      campus: a.submissions?.programs?.campuses?.name ?? "—",
      level: shortLevel(level?.code, level?.name),
      levelCode: level?.code ?? null,
      accreditor:
        (a.assignment_accreditors ?? [])
          .map((m) => (m.profiles ? `${m.profiles.surname}, ${m.profiles.given_name}` : null))
          .filter((n): n is string => Boolean(n))
          .join("; ") || "—",
      readiness: a.submission_id ? (readiness.get(a.submission_id) ?? 0) : 0,
    };
  });

  const note = asOfNow();
  const summary = (levels ?? []).map((l) => ({
    label: l.code === "PSV" ? "PSV" : `LEVEL ${l.code}`,
    value: String(programs.filter((p) => p.levelCode === l.code).length),
    note,
  }));

  return {
    summary,
    programs,
    campuses: (campuses ?? []).map((c) => c.name),
    levels: (levels ?? []).map((l) => shortLevel(l.code, l.name)),
  };
}
