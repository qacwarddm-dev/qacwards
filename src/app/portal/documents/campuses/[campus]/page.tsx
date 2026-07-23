import { notFound } from "next/navigation";
import { CAMPUSES, DOCUMENT_FOLDERS } from "@/components/portal/data";
import { DocumentBrowser, FolderGrid } from "@/components/portal/kit";

/** assets/FIGMA/qac_personnel/02.5.1-Documents-Campuses-Alfonso,Cavite.png */
export default async function CampusPage({
  params,
}: {
  params: Promise<{ campus: string }>;
}) {
  const { campus: slug } = await params;
  const campus = CAMPUSES.find((c) => c.slug === slug);
  if (!campus) notFound();

  return (
    <DocumentBrowser
      backHref="/portal/documents/campuses"
      crumbs={[
        { label: "Campuses", href: "/portal/documents/campuses" },
        { label: campus.name },
      ]}
    >
      <FolderGrid
        entries={DOCUMENT_FOLDERS}
        hrefFor={(f) => `/portal/documents/campuses/${campus.slug}/${f.slug}`}
      />
    </DocumentBrowser>
  );
}
