import { notFound } from "next/navigation";
import {
  CAMPUSES,
  DOCUMENT_FOLDERS,
  SAMPLE_FILES,
} from "@/components/portal/data";
import { DocumentBrowser, EmptyState, FileCard } from "@/components/portal/kit";

/**
 * assets/FIGMA/qac_personnel/02.5.1.1-...-Sample-Docs.png — the prototype only
 * fills "AACCUP Certificate"; every other folder shows the empty state.
 */
export default async function CampusFolderPage({
  params,
}: {
  params: Promise<{ campus: string; folder: string }>;
}) {
  const { campus: campusSlug, folder: folderSlug } = await params;
  const campus = CAMPUSES.find((c) => c.slug === campusSlug);
  const folder = DOCUMENT_FOLDERS.find((f) => f.slug === folderSlug);
  if (!campus || !folder) notFound();

  const files = folder.slug === "aaccup-certificate" ? SAMPLE_FILES : [];

  return (
    <DocumentBrowser
      backHref={`/portal/documents/campuses/${campus.slug}`}
      crumbs={[
        { label: "Campuses", href: "/portal/documents/campuses" },
        { label: campus.name, href: `/portal/documents/campuses/${campus.slug}` },
        { label: folder.name },
      ]}
    >
      {files.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-wrap gap-[24px]">
          {files.map((f) => (
            <FileCard key={f.name} name={f.name} thumbnail={f.thumbnail} />
          ))}
        </div>
      )}
    </DocumentBrowser>
  );
}
