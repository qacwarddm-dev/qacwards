import { QAC_SEAL } from "@/components/portal/data";
import { DocumentBrowser, FolderGrid } from "@/components/portal/kit";
import { createClient } from "@/lib/supabase/server";

/**
 * assets/FIGMA/qac_personnel/02.5-Documents-Campuses.png
 *
 * Reads the real `campuses` table rather than `CAMPUSES` (data.ts) — that
 * constant's slugs carry the province ("alfonso-cavite") for display purposes
 * and do not match `campuses.slug` ("alfonso", the seed's join key used
 * throughout `programs.ts`), which `[campus]/page.tsx` needs to resolve a real
 * campus's programmes.
 */
export default async function CampusesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campuses")
    .select("slug, name")
    .eq("is_main", false)
    .order("name");

  const entries = (data ?? []).map((c) => ({ ...c, badge: QAC_SEAL }));

  return (
    <DocumentBrowser backHref="/portal/documents" crumbs={[{ label: "Campuses" }]}>
      <FolderGrid
        entries={entries}
        hrefFor={(c) => `/portal/documents/campuses/${c.slug}`}
      />
    </DocumentBrowser>
  );
}
