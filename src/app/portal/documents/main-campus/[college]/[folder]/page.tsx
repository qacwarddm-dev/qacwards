import { notFound } from "next/navigation";
import { COLLEGES, DOCUMENT_FOLDERS } from "@/components/portal/data";
import { DocumentBrowser, EmptyState } from "@/components/portal/kit";

/**
 * assets/FIGMA/qac_personnel/02.6.1-...-Sample EmptyFolder.png — the prototype
 * shows this branch empty.
 */
export default async function CollegeFolderPage({
  params,
}: {
  params: Promise<{ college: string; folder: string }>;
}) {
  const { college: collegeSlug, folder: folderSlug } = await params;
  const college = COLLEGES.find((c) => c.slug === collegeSlug);
  const folder = DOCUMENT_FOLDERS.find((f) => f.slug === folderSlug);
  if (!college || !folder) notFound();

  return (
    <DocumentBrowser
      backHref={`/portal/documents/main-campus/${college.slug}`}
      crumbs={[
        { label: "Main Campus", href: "/portal/documents/main-campus" },
        {
          label: college.name,
          href: `/portal/documents/main-campus/${college.slug}`,
        },
        { label: folder.name },
      ]}
    >
      <EmptyState />
    </DocumentBrowser>
  );
}
