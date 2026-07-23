import { CAMPUSES } from "@/components/portal/data";
import { DocumentBrowser, FolderGrid } from "@/components/portal/kit";

/** assets/FIGMA/qac_personnel/02.5-Documents-Campuses.png */
export default function CampusesPage() {
  return (
    <DocumentBrowser backHref="/portal/documents" crumbs={[{ label: "Campuses" }]}>
      <FolderGrid
        entries={CAMPUSES}
        hrefFor={(c) => `/portal/documents/campuses/${c.slug}`}
      />
    </DocumentBrowser>
  );
}
