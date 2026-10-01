import { createClient } from "@/lib/supabase/server";
import {
  LEVEL_SHORT,
  areaLabel,
  fileSize,
  personName,
  phaseLabel,
  programMid,
  programShort,
  shortDate,
} from "@/lib/program-names";
import {
  countSlots,
  approvedPct,
  allPhaseSlots,
  includedAreas,
  missingChoices,
  INDICATORS,
  ratedCount,
  areaMean,
  describeMean,
  type DocState,
  type HistItem,
  type Slot,
  type PhaseGroup,
  type ProgramInfo,
  type SubmissionReview,
  type Counts,
  type IndicatorRating,
  type AreaRatings,
} from "@/lib/review-model";
export {
  countSlots,
  approvedPct,
  allPhaseSlots,
  includedAreas,
  missingChoices,
  INDICATORS,
  ratedCount,
  areaMean,
  describeMean,
  type DocState,
  type HistItem,
  type Slot,
  type PhaseGroup,
  type ProgramInfo,
  type SubmissionReview,
  type Counts,
  type IndicatorRating,
  type AreaRatings,
};

type DocRow = {
  id: string;
  submission_id: string;
  phase_document_id: string | null;
  requirement_area_id: string | null;
  title: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: string | null;
  version: number;
  is_current: boolean;
  is_draft: boolean;
  upload_note: string | null;
};

type ReviewRow = {
  id: string;
  submission_document_id: string;
  reviewer_id: string | null;
  decision: string;
  note: string | null;
  created_at: string;
};

type Person = { id: string; surname: string; given_name: string; middle_initial: string | null };

export async function loadDocsAndReviews(submissionIds: string[]) {
  const supabase = await createClient();
  if (!submissionIds.length) return { docs: [] as DocRow[], reviews: [] as ReviewRow[], people: new Map<string, string>() };
  const { data: docs } = await supabase
    .from("submission_documents")
    .select("id, submission_id, phase_document_id, requirement_area_id, title, file_size, uploaded_at, uploaded_by, version, is_current, is_draft, upload_note")
    .in("submission_id", submissionIds)
    .order("uploaded_at");
  const ids = (docs ?? []).map((d) => d.id);
  const { data: reviews } = ids.length
    ? await supabase
        .from("document_reviews")
        .select("id, submission_document_id, reviewer_id, decision, note, created_at")
        .in("submission_document_id", ids)
        .order("created_at")
    : { data: [] as ReviewRow[] };
  const personIds = new Set<string>();
  for (const d of docs ?? []) if (d.uploaded_by) personIds.add(d.uploaded_by);
  for (const r of reviews ?? []) if (r.reviewer_id) personIds.add(r.reviewer_id);
  const people = new Map<string, string>();
  if (personIds.size) {
    const { data } = await supabase.from("profiles").select("id, surname, given_name, middle_initial").in("id", [...personIds]);
    for (const p of (data ?? []) as Person[]) people.set(p.id, personName(p));
  }
  return { docs: (docs ?? []) as DocRow[], reviews: (reviews ?? []) as ReviewRow[], people };
}

export function buildSlot(
  kind: "phase" | "area",
  ref: { id: string; name: string; ordinal: number; is_optional: boolean },
  displayName: string,
  slotDocs: DocRow[],
  reviews: ReviewRow[],
  people: Map<string, string>,
): Slot {
  const current = slotDocs.filter((d) => d.is_current && !d.is_draft).at(-1) ?? null;
  const draft = slotDocs.filter((d) => d.is_draft).at(-1) ?? null;
  const docIds = new Set(slotDocs.filter((d) => !d.is_draft).map((d) => d.id));
  const revs = reviews.filter((r) => docIds.has(r.submission_document_id));
  const curRevs = current ? revs.filter((r) => r.submission_document_id === current.id) : [];
  const last = curRevs.at(-1) ?? null;

  let state: DocState = "missing";
  if (current) state = last?.decision === "approved" ? "approved" : last?.decision === "returned" ? "returned" : "pending";
  else if (draft) state = "draft";

  const history: HistItem[] = [];
  for (const d of slotDocs) {
    if (d.is_draft) continue;
    if (d.version > 1 || d.upload_note)
      history.push({
        who: d.uploaded_by ? (people.get(d.uploaded_by) ?? "Program representative") : "Program representative",
        byId: d.uploaded_by,
        date: shortDate(d.uploaded_at),
        at: d.uploaded_at,
        msg: d.upload_note || "Uploaded a revised version.",
        tone: "me",
      });
  }
  for (const r of revs) {
    if (r.decision === "undone") {
      const i = history.map((h) => h.tone).lastIndexOf("ok");
      if (i >= 0) history.splice(i, 1);
      continue;
    }
    history.push({
      who: r.reviewer_id ? (people.get(r.reviewer_id) ?? "Reviewer") : "Reviewer",
      byId: r.reviewer_id,
      date: shortDate(r.created_at),
      at: r.created_at,
      msg: r.decision === "approved" ? r.note || "Approved." : r.note || "",
      tone: r.decision === "approved" ? "ok" : "rev",
    });
  }
  history.sort((a, b) => a.at.localeCompare(b.at));

  const returnedRev = state === "returned" ? last : null;
  const approvedRev = state === "approved" ? last : null;

  return {
    key: `${kind}:${ref.id}`,
    kind,
    refId: ref.id,
    name: displayName,
    ordinal: ref.ordinal,
    optional: ref.is_optional,
    state,
    docId: current?.id ?? null,
    file: current?.title ?? null,
    size: current ? fileSize(current.file_size) : null,
    date: current ? shortDate(current.uploaded_at) : null,
    uploadedAt: current?.uploaded_at ?? null,
    version: current?.version ?? 0,
    by: current?.uploaded_by ? (people.get(current.uploaded_by) ?? null) : null,
    returnNote: returnedRev?.note ?? null,
    returnedBy: returnedRev?.reviewer_id ? (people.get(returnedRev.reviewer_id) ?? null) : null,
    returnedById: returnedRev?.reviewer_id ?? null,
    reviewedBy: approvedRev?.reviewer_id ? (people.get(approvedRev.reviewer_id) ?? null) : null,
    reviewedById: approvedRev?.reviewer_id ?? null,
    draftId: draft?.id ?? null,
    draftFile: draft?.title ?? null,
    history,
  };
}

type Ref = { id: string; name: string; ordinal: number; is_optional: boolean };

export async function getReferenceStructure() {
  const supabase = await createClient();
  const [{ data: phases }, { data: areas }, { data: levels }] = await Promise.all([
    supabase.from("phases").select("id, ordinal, name, phase_documents(id, ordinal, name, is_optional)").order("ordinal"),
    supabase.from("requirement_areas").select("id, level_id, ordinal, name, is_optional").order("ordinal"),
    supabase.from("accreditation_levels").select("id, code, name, ordinal, required_choices").order("ordinal"),
  ]);
  return {
    phases: (phases ?? []).map((p) => ({
      id: p.id,
      ordinal: p.ordinal,
      name: p.name,
      docs: [...(p.phase_documents ?? [])].sort((a, b) => a.ordinal - b.ordinal) as Ref[],
    })),
    areasByLevel: (areas ?? []).reduce<Record<string, Ref[]>>((m, a) => {
      (m[a.level_id] ??= []).push(a);
      return m;
    }, {}),
    levels: levels ?? [],
  };
}

type SubmissionMeta = {
  id: string;
  status: string;
  level_id: string;
  programs: {
    id: string;
    name: string;
    campuses: { name: string } | null;
    colleges: { code: string; name: string } | null;
  } | null;
  accreditation_levels: { code: string; name: string; required_choices: number | null } | null;
};

export async function getSubmissionReviews(submissionIds: string[]): Promise<SubmissionReview[]> {
  if (!submissionIds.length) return [];
  const supabase = await createClient();
  const [{ data: subs }, ref, loaded, { data: choices }] = await Promise.all([
    supabase
      .from("submissions")
      .select("id, status, level_id, programs(id, name, campuses(name), colleges(code, name)), accreditation_levels(code, name, required_choices)")
      .in("id", submissionIds),
    getReferenceStructure(),
    loadDocsAndReviews(submissionIds),
    supabase.from("submission_choices").select("submission_id, requirement_area_id").in("submission_id", submissionIds),
  ]);

  return ((subs ?? []) as unknown as SubmissionMeta[]).map((s) => {
    const docs = loaded.docs.filter((d) => d.submission_id === s.id);
    const phases: PhaseGroup[] = ref.phases.map((p) => ({
      id: p.id,
      ordinal: p.ordinal,
      name: phaseLabel(p.ordinal, p.name),
      docs: p.docs.map((d) =>
        buildSlot("phase", d, d.name, docs.filter((x) => x.phase_document_id === d.id), loaded.reviews, loaded.people),
      ),
    }));
    const areas = (ref.areasByLevel[s.level_id] ?? []).map((a) =>
      buildSlot("area", a, areaLabel(a.name), docs.filter((x) => x.requirement_area_id === a.id), loaded.reviews, loaded.people),
    );
    const p = s.programs;
    const code = s.accreditation_levels?.code ?? "";
    return {
      submissionId: s.id,
      status: s.status,
      levelId: s.level_id,
      levelCode: code,
      levelName: s.accreditation_levels?.name ?? "—",
      levelShort: LEVEL_SHORT[code] ?? code,
      requiredChoices: s.accreditation_levels?.required_choices ?? null,
      program: {
        id: p?.id ?? "",
        name: p?.name ?? "—",
        mid: programMid(p?.name ?? "—"),
        short: programShort(p?.name ?? "—"),
        campus: p?.campuses?.name ?? "—",
        college: p?.colleges?.code ?? "—",
        collegeName: p?.colleges?.name ?? "Not Applicable (campus program)",
      },
      phases,
      areas,
      chosen: (choices ?? []).filter((c) => c.submission_id === s.id).map((c) => c.requirement_area_id),
    };
  });
}

/** All-missing slots for a level that has no submission row yet. */
export function emptyReview(
  ref: Awaited<ReturnType<typeof getReferenceStructure>>,
  level: { id: string; code: string; name: string; required_choices: number | null },
  program: ProgramInfo,
): SubmissionReview {
  const none = new Map<string, string>();
  return {
    submissionId: "",
    status: "not_started",
    levelId: level.id,
    levelCode: level.code,
    levelName: level.name,
    levelShort: LEVEL_SHORT[level.code] ?? level.code,
    requiredChoices: level.required_choices,
    program,
    phases: ref.phases.map((p) => ({
      id: p.id,
      ordinal: p.ordinal,
      name: phaseLabel(p.ordinal, p.name),
      docs: p.docs.map((d) => buildSlot("phase", d, d.name, [], [], none)),
    })),
    areas: (ref.areasByLevel[level.id] ?? []).map((a) => buildSlot("area", a, areaLabel(a.name), [], [], none)),
    chosen: [],
  };
}

// ----------------------------------------------------------- ratings

export async function getAreaRatings(assignmentId: string, accreditorId: string): Promise<AreaRatings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("area_ratings")
    .select("requirement_area_id, indicator, rating, remark")
    .eq("assignment_id", assignmentId)
    .eq("accreditor_id", accreditorId);
  const out: AreaRatings = {};
  for (const r of data ?? []) {
    (out[r.requirement_area_id] ??= {})[r.indicator] = { rating: r.rating, remark: r.remark ?? "" };
  }
  return out;
}


// ------------------------------------------------------------ nav counts

async function activeSubmissionIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("submissions")
    .select("id, status")
    .in("status", ["in_progress", "submitted", "under_evaluation", "returned"]);
  return (data ?? []).map((s) => s.id);
}

function slotStates(docs: DocRow[], reviews: ReviewRow[]) {
  const out: { doc: DocRow; state: DocState; lastBy: string | null }[] = [];
  for (const d of docs) {
    if (!d.is_current || d.is_draft) continue;
    const last = reviews.filter((r) => r.submission_document_id === d.id).at(-1);
    const state: DocState = last?.decision === "approved" ? "approved" : last?.decision === "returned" ? "returned" : "pending";
    out.push({ doc: d, state, lastBy: last?.reviewer_id ?? null });
  }
  return out;
}

export async function getRepFeedbackCount(): Promise<number> {
  try {
    const ids = await activeSubmissionIds();
    const { docs, reviews } = await loadDocsAndReviews(ids);
    const returned = slotStates(docs, reviews).filter((s) => s.state === "returned").length;
    const { getCompletedVisits } = await import("@/lib/visit-evaluations");
    const visits = await getCompletedVisits();
    const pendingEvals = visits.reduce((n, v) => n + v.targets.filter((t) => !t.submittedAt).length, 0);
    return returned + pendingEvals;
  } catch {
    return 0;
  }
}

/** Documents this accreditor returned whose slot now holds a newer, unreviewed upload. */
export async function getResubmissions(viewerId: string) {
  const supabase = await createClient();
  const { data: mine } = await supabase
    .from("document_reviews")
    .select("submission_document_id, note, created_at")
    .eq("reviewer_id", viewerId)
    .eq("decision", "returned")
    .order("created_at");
  if (!mine?.length) return [];
  const { data: returnedDocs } = await supabase
    .from("submission_documents")
    .select("id, submission_id, phase_document_id, requirement_area_id")
    .in("id", mine.map((m) => m.submission_document_id));
  const subIds = [...new Set((returnedDocs ?? []).map((d) => d.submission_id))];
  const reviewsets = await getSubmissionReviews(subIds);
  const out: {
    review: SubmissionReview;
    slot: Slot;
    remark: string;
  }[] = [];
  for (const d of returnedDocs ?? []) {
    const r = reviewsets.find((x) => x.submissionId === d.submission_id);
    if (!r) continue;
    const slot = [...allPhaseSlots(r), ...r.areas].find(
      (s) => s.refId === (d.phase_document_id ?? d.requirement_area_id),
    );
    if (!slot || slot.state !== "pending" || slot.docId === d.id) continue;
    if (out.some((o) => o.slot.key === slot.key && o.review.submissionId === r.submissionId)) continue;
    const remark = mine.filter((m) => m.submission_document_id === d.id).at(-1)?.note ?? "";
    out.push({ review: r, slot, remark });
  }
  return out;
}

export async function getResubmissionCount(viewerId: string): Promise<number> {
  try {
    return (await getResubmissions(viewerId)).length;
  } catch {
    return 0;
  }
}

export async function getQacNavCounts(): Promise<{ acc: number; ext: number }> {
  try {
    const supabase = await createClient();
    const ids = await activeSubmissionIds();
    const { docs, reviews } = await loadDocsAndReviews(ids);
    const ext = slotStates(docs.filter((d) => d.phase_document_id), reviews).filter((s) => s.state === "pending").length;

    const { data: asg } = await supabase
      .from("assignments")
      .select("id, status, assignment_accreditors(response)")
      .not("status", "in", "(score_returned,declined)");
    const { data: reps } = await supabase.from("accreditor_reports").select("assignment_id, status").eq("status", "submitted");
    const withReports = new Set((reps ?? []).map((r) => r.assignment_id));
    const acc = (asg ?? []).filter(
      (a) => (a.assignment_accreditors ?? []).filter((m) => m.response !== "rejected").length < 2 || withReports.has(a.id),
    ).length;
    return { acc, ext };
  } catch {
    return { acc: 0, ext: 0 };
  }
}
