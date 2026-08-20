import { COLLEGES } from "@/components/portal/data";
import { DocumentBrowser, FolderGrid } from "@/components/portal/kit";

/** assets/FIGMA/qac_personnel/02.6-Document-MainCampus.png */
export default function MainCampusPage() {
  return (
    <DocumentBrowser
      backHref="/portal/documents"
      crumbs={[{ label: "Main Campus" }]}
    >
      <h1 className="sr-only">Documents — Main Campus</h1>
      <FolderGrid
        entries={COLLEGES}
        hrefFor={(c) => `/portal/documents/main-campus/${c.slug}`}
      />
    </DocumentBrowser>
  );
}
