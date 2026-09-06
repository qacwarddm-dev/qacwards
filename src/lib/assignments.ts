import { createClient } from "@/lib/supabase/server";

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
  /** Expertise areas this accreditor holds that match the programme's name. */
  matched: string[];
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
 * Matching is by `accreditor_expertise` against the programme's name. It is a
 * **suggestion, not a gate** — QAC assigns whoever they judge appropriate, and
 * the ranking exists so a sensible team is the default rather than the result of
 * scrolling. There is no expertise↔programme mapping table in the reference data
 * (OtherContext.txt does not provide one), and inventing one would be inventing
 * reference data; word overlap against the programme title is the honest
 * approximation, and it is why unmatched accreditors are still returned.
 *
 * QAC Personnel are listed after every internal accreditor as the fallback the
 * owner described: sometimes nobody eligible matches, and a QAC staff member
 * takes the assignment themselves.
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

  const title = (program?.name ?? "").toLowerCase();

  return (accreditors ?? [])
    .map((a) => {
      const areas = (a.accreditor_expertise ?? [])
        .map((row) => row.expertise_areas?.name)
        .filter((n): n is string => Boolean(n));

      // An expertise matches when its significant words all appear in the
      // programme title — "Information Technology" matches "BS in Information
      // Technology", "Research" does not match "BS in Biology".
      const matched = areas.filter((area) =>
        area
          .toLowerCase()
          .split(/[^a-z]+/)
          .filter((w) => w.length > 3)
          .every((word) => title.includes(word)),
      );

      return {
        id: a.id,
        name: `${a.surname}, ${a.given_name}`,
        webmail: a.webmail,
        matched,
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
      `id, status, due_date,
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

/** Behind `/portal/evaluation` — the accreditor's own assignments, one row
 *  per assignment, with the same score-visibility rule the fake data drew:
 *  "Not yet released" until `evaluations.released_at` is set. */
export type EvaluationListRow = {
  id: string;
  campus: string;
  college: string;
  program: string;
  level: string;
  accreditor: string;
  status: string;
  score: string;
  /** The caller's own invitation. Round 2 §1 makes acceptance what unblocks the
   *  sheet, so the list has to know whether this row is workable yet. */
  myResponse: string;
};

/**
 * The caller's own evaluation queue.
 *
 * Filtered on team membership here rather than left to RLS. RLS was enough
 * while only the `internal_accreditor` role could reach this screen — the
 * accreditor policy returns exactly their assignments. Round 2 §2 lets a QAC
 * Personnel act as an accreditor too, and QAC's policy returns *every*
 * assignment, so without this filter a dual-role account's evaluation list
 * would be the whole system's.
 */
export async function getMyEvaluationAssignments(): Promise<EvaluationListRow[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: mine } = await supabase
    .from("assignment_accreditors")
    .select("assignment_id, response")
    .eq("profile_id", user.id);

  const myResponses = new Map((mine ?? []).map((m) => [m.assignment_id, m.response]));
  if (myResponses.size === 0) return [];

  const { data: assignments } = await supabase
    .from("assignments")
    .select(
      `id, status,
       submissions(programs(name, campuses(name), colleges(code)), accreditation_levels(name)),
       assignment_accreditors(profiles(surname, given_name))`,
    )
    .in("id", [...myResponses.keys()])
    .order("created_at", { ascending: false });

  const ids = (assignments ?? []).map((a) => a.id);

  const { data: evaluations } = ids.length
    ? await supabase
        .from("evaluations")
        .select("assignment_id, score, outcome, released_at")
        .in("assignment_id", ids)
    : {
        data: [] as {
          assignment_id: string;
          score: number | null;
          outcome: string | null;
          released_at: string | null;
        }[],
      };

  const evalByAssignment = new Map((evaluations ?? []).map((e) => [e.assignment_id, e]));

  return (assignments ?? []).map((a) => ({
    id: a.id,
    campus: a.submissions?.programs?.campuses?.name ?? "—",
    college: a.submissions?.programs?.colleges?.code ?? "—",
    program: a.submissions?.programs?.name ?? "—",
    level: a.submissions?.accreditation_levels?.name ?? "—",
    accreditor:
      (a.assignment_accreditors ?? [])
        .map((m) => (m.profiles ? `${m.profiles.surname}, ${m.profiles.given_name}` : null))
        .filter((n): n is string => Boolean(n))
        .join("; ") || "—",
    status: a.status,
    score: scoreDisplay(evalByAssignment.get(a.id) ?? null),
    myResponse: myResponses.get(a.id) ?? "pending",
  }));
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
  signatories: { id: string; name: string; response: string }[];
};

export async function getAssignmentDetail(assignmentId: string): Promise<AssignmentDetail | null> {
  const supabase = await createClient();

  const [{ data }, { data: auth }] = await Promise.all([
    supabase
      .from("assignments")
      .select(
        `id, status,
         submissions(website_url, programs(name, campuses(name), colleges(code)), accreditation_levels(name)),
         assignment_accreditors(profile_id, response, profiles(surname, given_name))`,
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
  };
}
