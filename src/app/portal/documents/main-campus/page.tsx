import { COLLEGES } from "@/components/portal/data";
import { DocumentBrowser, FolderGrid } from "@/components/portal/kit";

/** assets/FIGMA/qac_personnel/02.6-Document-MainCampus.png */
export default function MainCampusPage() {
  return (
    <DocumentBrowser
      backHref="/portal/documents"
      crumbs={[{ label: "Main Campus" }]}
    >
      <FolderGrid
        entries={COLLEGES}
        hrefFor={(c) => `/portal/documents/main-campus/${c.slug}`}
      />
    </DocumentBrowser>
  );
}
