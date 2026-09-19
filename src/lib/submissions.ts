import { createClient } from "@/lib/supabase/server";

/**
 * Reads behind `/portal/submission`.
 *
 * Everything is scoped by RLS rather than by a `where` clause on the caller's
 * programmes: `my_program_ids()` is already a predicate on every policy, so a
 * representative asking for another campus's programme gets zero rows, not a
 * filtered list (§1). The queries below therefore look unguarded and are not.
 */

export type ProgramOption = { id: string; slug: string; label: string };

/** Slug is derived, not stored — the built screen keys its URLs on one, and the
 *  programmes table has no slug column because programme names are not unique
 *  across campuses (decision 6). Prefixing with the id keeps it unambiguous. */
export function programSlug(id: string, name: string): string {
  const words = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${words}-${id.slice(0, 8)}`;
}

export async function getMyPrograms(): Promise<ProgramOption[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("program_reps")
    .select("programs(id, name)")
    .order("program_id");

  return (data ?? [])
    .map((row) => row.programs)
    .filter((p): p is { id: string; name: string } => Boolean(p))
    .map((p) => ({ id: p.id, slug: programSlug(p.id, p.name), label: p.name }));
}

export type LevelReadiness = {
  levelId: string;
  code: string;
  label: string;
  ordinal: number;
  submissionId: string | null;
  percent: number;
  requiredCount: number;
  uploadedCount: number;
  status: string;
};

/**
 * The five level rows for one programme, each carrying its readiness.
 *
 * A level with no submission yet still appears, at 0% — the screen lists all five
 * regardless, and "no row yet" and "0 uploaded" are the same thing to a
 * representative looking at the list.
 */
export async function getLevelReadiness(
  programId: string,
  cycleId: string | null,
): Promise<LevelReadiness[]> {
  const supabase = await createClient();

  const [{ data: levels }, { data: submissions }, { data: readiness }, { data: psvAward }] =
    await Promise.all([
      supabase
        .from("accreditation_levels")
        .select("id, code, name, ordinal, required_choices")
        .order("ordinal"),
      supabase
        .from("submissions")
        .select("id, level_id, status, attempt")
        .eq("program_id", programId)
        .order("attempt", { ascending: false }),
      supabase
        .from("submission_readiness")
        .select("submission_id, level_id, required_count, uploaded_count, readiness_percent")
        .eq("program_id", programId),
      supabase
        .from("program_accreditations")
        // `!level_id` disambiguates the embed: program_accreditations has two
        // FKs into accreditation_levels (level_id, demoted_from_level_id), and
        // an unqualified embed errors as ambiguous — which came back as a
        // silently-null `data` here, not a thrown exception.
        .select("id, accreditation_levels!level_id!inner(code)")
        .eq("program_id", programId)
        .eq("status", "active")
        .eq("accreditation_levels.code", "PSV")
        .maybeSingle(),
    ]);

  void cycleId; // cycles scope submissions; the picker lands in a later pass

  const byLevel = new Map<string, { id: string; status: string }>();
  for (const s of submissions ?? []) {
    // Ordered by attempt descending, so the first one seen is the latest.
    if (!byLevel.has(s.level_id)) byLevel.set(s.level_id, { id: s.id, status: s.status });
  }

  const readinessBySubmission = new Map(
    (readiness ?? []).map((r) => [r.submission_id, r]),
  );

  // Client's call 2026-09-19: PSV must be fully passed (same "active award"
  // check ensureSubmission gates Level I's creation on) before ANY level
  // above it shows progress — a level someone got docs into ahead of PSV
  // clearing still reads as untouched until PSV does.
  const psvOrdinal = (levels ?? []).find((l) => l.code === "PSV")?.ordinal ?? 0;
  const psvCleared = Boolean(psvAward);

  return (levels ?? []).map((level) => {
    const submission = byLevel.get(level.id) ?? null;
    const stats = submission ? readinessBySubmission.get(submission.id) : undefined;
    const gated = level.ordinal > psvOrdinal && !psvCleared;

    return {
      levelId: level.id,
      code: level.code,
      label: level.name,
      ordinal: level.ordinal,
      submissionId: submission?.id ?? null,
      percent: gated ? 0 : (stats?.readiness_percent ?? 0),
      requiredCount: stats?.required_count ?? 0,
      uploadedCount: stats?.uploaded_count ?? 0,
      status: gated ? "not_started" : (submission?.status ?? "not_started"),
    };
  });
}

/** The open cycle, or null when QAC has not opened one. Only one can be open at
 *  a time — a partial unique index guarantees `maybeSingle` is safe here. */
export async function getOpenCycle() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("accreditation_cycles")
    .select("id, name, start_date, end_date")
    .eq("status", "open")
    .maybeSingle();
  return data;
}

/**
 * Phase progress for one submission: the four phases, each with how many of its
 * documents are uploaded.
 */
export async function getPhaseProgress(submissionId: string | null) {
  const supabase = await createClient();

  const { data: phases } = await supabase
    .from("phases")
    .select("id, ordinal, name, phase_documents(id, ordinal, name, is_optional)")
    .order("ordinal");

  const uploaded = new Set<string>();
  if (submissionId) {
    const { data: docs } = await supabase
      .from("submission_documents")
      .select("phase_document_id")
      .eq("submission_id", submissionId)
      .eq("is_current", true);
    for (const d of docs ?? []) if (d.phase_document_id) uploaded.add(d.phase_document_id);
  }

  return (phases ?? []).map((phase) => {
    const documents = (phase.phase_documents ?? []).sort((a, b) => a.ordinal - b.ordinal);
    const done = documents.filter((d) => uploaded.has(d.id)).length;
    return {
      id: phase.id,
      ordinal: phase.ordinal,
      label: `Phase ${phase.ordinal} (${phase.name})`,
      percent: documents.length === 0 ? 0 : Math.floor((done / documents.length) * 100),
      documents: documents.map((d) => ({
        id: d.id,
        name: d.name,
        isOptional: d.is_optional,
        uploaded: uploaded.has(d.id),
      })),
    };
  });
}

/**
 * The areas one level is judged on, with Level III's chosen two marked.
 *
 * Level III stores 7 rows — 2 mandatory and 5 to choose from — and the
 * representative picks 2 (`accreditation_levels.required_choices`). The choices
 * live in `submission_choices` rather than being inferred from which optional
 * areas happen to have uploads, so a programme can commit to a pair before
 * uploading anything for it.
 */
export async function getRequirementAreas(levelId: string, submissionId: string | null) {
  const supabase = await createClient();

  const [{ data: areas }, { data: chosen }, { data: docs }] = await Promise.all([
    supabase
      .from("requirement_areas")
      .select("id, ordinal, name, is_optional")
      .eq("level_id", levelId)
      .order("ordinal"),
    submissionId
      ? supabase
          .from("submission_choices")
          .select("requirement_area_id")
          .eq("submission_id", submissionId)
      : Promise.resolve({ data: [] as { requirement_area_id: string }[] }),
    submissionId
      ? supabase
          .from("submission_documents")
          .select("requirement_area_id")
          .eq("submission_id", submissionId)
          .eq("is_current", true)
      : Promise.resolve({ data: [] as { requirement_area_id: string | null }[] }),
  ]);

  const chosenIds = new Set((chosen ?? []).map((c) => c.requirement_area_id));
  const uploadedIds = new Set(
    (docs ?? []).map((d) => d.requirement_area_id).filter(Boolean) as string[],
  );

  return (areas ?? []).map((area) => ({
    id: area.id,
    name: area.name,
    isOptional: area.is_optional,
    chosen: chosenIds.has(area.id),
    uploaded: uploadedIds.has(area.id),
  }));
}
