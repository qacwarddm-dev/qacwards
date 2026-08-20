import { createClient } from "@/lib/supabase/server";

/**
 * Reads behind the three document tabs and the QAC repository tree.
 *
 * The NDA gate is **not** implemented here. `common_documents` carries an RLS
 * policy requiring `has_nda()`, and the `common-docs` bucket carries the same
 * check on its objects — so a user without an NDA gets an empty list *and* cannot
 * fetch a file whose path they already know. Hiding the tab would be neither
 * (§B10: UI hiding is not access control).
 */

export type RepositoryFolder = {
  id: string;
  slug: string;
  name: string;
  ordinal: number;
  fileCount: number;
};

export async function getRepositoryFolders(
  programId: string | string[] | null,
): Promise<RepositoryFolder[]> {
  const supabase = await createClient();
  const ids = Array.isArray(programId) ? programId : programId ? [programId] : [];

  const [{ data: folders }, { data: files }] = await Promise.all([
    supabase.from("repository_folders").select("id, slug, name, ordinal").order("ordinal"),
    ids.length
      ? supabase
          .from("repository_files")
          .select("folder_id")
          .in("program_id", ids)
          .eq("is_archived", false)
      : Promise.resolve({ data: [] as { folder_id: string }[] }),
  ]);

  const counts = new Map<string, number>();
  for (const f of files ?? []) {
    counts.set(f.folder_id, (counts.get(f.folder_id) ?? 0) + 1);
  }

  return (folders ?? []).map((f) => ({
    id: f.id,
    slug: f.slug,
    name: f.name,
    ordinal: f.ordinal,
    fileCount: counts.get(f.id) ?? 0,
  }));
}

/**
 * `programId` takes an array for the QAC tree, where one folder view spans
 * every programme in a college or an off-main campus, not one representative's
 * own single programme — `repository_files.program_id` has no wider grouping
 * column, so every scope resolves down to a list of programme ids first (see
 * `getCampusPrograms`/`getCollegePrograms`).
 */
export async function getRepositoryFiles(programId: string | string[], folderId: string) {
  const supabase = await createClient();
  const ids = Array.isArray(programId) ? programId : [programId];

  const { data } = await supabase
    .from("repository_files")
    .select("id, title, storage_path, file_size, doc_uuid, created_at, programs(name)")
    .in("program_id", ids)
    .eq("folder_id", folderId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  return (data ?? []).map((f) => ({ ...f, programName: f.programs?.name ?? null }));
}

export type RepositoryScopeProgram = { id: string; name: string };

/** Programmes at one off-main campus — `campuses/[campus]` jumps straight from
 *  campus to folder because, off-main, a campus's programmes *are* its whole
 *  repository scope (no college in between; see `programs.ts`'s comment on why
 *  `college_id` is null there). */
export async function getCampusPrograms(campusSlug: string): Promise<RepositoryScopeProgram[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("id, name, campuses!inner(slug)")
    .eq("campuses.slug", campusSlug)
    .order("name");

  return (data ?? []).map((p) => ({ id: p.id, name: p.name }));
}

/** Programmes in one main-campus college — `main-campus/[college]`'s scope. */
export async function getCollegePrograms(collegeCode: string): Promise<RepositoryScopeProgram[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("id, name, colleges!inner(code)")
    .eq("colleges.code", collegeCode)
    .order("name");

  return (data ?? []).map((p) => ({ id: p.id, name: p.name }));
}

/**
 * Whether the signed-in user has filed an NDA.
 *
 * Used only to decide what the screen *says* — "upload your NDA to unlock" versus
 * the document list. The actual unlocking is the policy; if this function were
 * wrong in the permissive direction the user would still get zero rows.
 */
export async function hasNda(): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("ndas")
    .select("profile_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  return Boolean(data);
}

export async function getCommonDocuments() {
  const supabase = await createClient();

  // Returns [] rather than throwing for a user with no NDA — the policy filters
  // the rows out, which is the same shape as "there are none".
  const { data } = await supabase
    .from("common_documents")
    .select("id, title, storage_path, file_size, created_at")
    .order("created_at", { ascending: false });

  return data ?? [];
}

export type TemplateRow = {
  id: string;
  title: string;
  storagePath: string;
  levelId: string | null;
  requirementAreaId: string | null;
  phaseDocumentId: string | null;
};

/** Templates for one level, plus the general ones that belong to no level. */
export async function getTemplates(levelId: string | null): Promise<TemplateRow[]> {
  const supabase = await createClient();

  const query = supabase
    .from("templates")
    .select("id, title, storage_path, level_id, requirement_area_id, phase_document_id")
    .order("title");

  const { data } = levelId
    ? await query.or(`level_id.eq.${levelId},level_id.is.null`)
    : await query;

  return (data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    storagePath: t.storage_path,
    levelId: t.level_id,
    requirementAreaId: t.requirement_area_id,
    phaseDocumentId: t.phase_document_id,
  }));
}
