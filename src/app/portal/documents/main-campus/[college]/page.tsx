import { notFound } from "next/navigation";
import { COLLEGES, DOCUMENT_FOLDERS } from "@/components/portal/data";
import { DocumentBrowser, FolderGrid } from "@/components/portal/kit";

/** assets/FIGMA/qac_personnel/02.6.1-Document-MainCampus-CollegeofAccountancyandFinance.png */
export default async function CollegePage({
  params,
}: {
  params: Promise<{ college: string }>;
}) {
  const { college: slug } = await params;
  const college = COLLEGES.find((c) => c.slug === slug);
  if (!college) notFound();

  return (
    <DocumentBrowser
      backHref="/portal/documents/main-campus"
      crumbs={[
        { label: "Main Campus", href: "/portal/documents/main-campus" },
        { label: college.name },
      ]}
    >
      <FolderGrid
        entries={DOCUMENT_FOLDERS}
        hrefFor={(f) => `/portal/documents/main-campus/${college.slug}/${f.slug}`}
      />
    </DocumentBrowser>
  );
}
