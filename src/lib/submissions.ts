import { createClient } from "@/lib/supabase/server";

/**
 * Reads behind `/portal/submission`.
 *
 * Everything is scoped by RLS rather than by a `where` clause on the caller's
 * programmes: `my_program_ids()` is already a predicate on every policy, so a
 * representative asking for another campus's programme gets zero rows, not a
 * filtered list (§1). The queries below therefore look unguarded and are not.
 */

export type ProgramOption = {
  id: string;
  slug: string;
  label: string;
  college: string | null;
  campus: string | null;
};

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
    .select("programs(id, name, colleges(name), campuses(name))")
    .order("program_id");

  return (data ?? [])
    .map((row) => row.programs)
    .filter((p) => p !== null)
    .map((p) => ({
      id: p.id,
      slug: programSlug(p.id, p.name),
      label: p.name,
      college: p.colleges?.name ?? null,
      campus: p.campuses?.name ?? null,
    }));
}
