import { notFound } from "next/navigation";
import { COLLEGES } from "@/components/portal/data";
import { DocFileGrid, DocumentBrowser } from "@/components/portal/kit";
import {
  getCollegePrograms,
  getRepositoryFiles,
  getRepositoryFolders,
} from "@/lib/documents";
import { createClient } from "@/lib/supabase/server";

/**
 * assets/FIGMA/qac_personnel/02.6.1-...-Sample EmptyFolder.png — the prototype
 * only shows this branch's empty state; `DocFileGrid` draws the populated one,
 * shared with the Program Rep Reports tab and the campus branch below.
 *
 * A college's repository files are actually scoped per-programme
 * (`repository_files.program_id`), and a college holds several — so this reads
 * one folder across every one of the college's programmes at once, each file
 * labelled with its programme so two BSIT sections' files aren't
 * indistinguishable in the grid.
 */
export default async function CollegeFolderPage({
  params,
}: {
  params: Promise<{ college: string; folder: string }>;
}) {
  const { college: collegeSlug, folder: folderSlug } = await params;
  const localCollege = COLLEGES.find((c) => c.slug === collegeSlug);
  if (!localCollege) notFound();

  const supabase = await createClient();
  const [{ data: college }, folders, programs] = await Promise.all([
    supabase.from("colleges").select("code, name").eq("code", collegeSlug.toUpperCase()).maybeSingle(),
    getRepositoryFolders(null),
    getCollegePrograms(collegeSlug.toUpperCase()),
  ]);
  const folder = folders.find((f) => f.slug === folderSlug);
  if (!college || !folder) notFound();

  const files = programs.length
    ? await getRepositoryFiles(
        programs.map((p) => p.id),
        folder.id,
      )
    : [];

  return (
    <DocumentBrowser
      backHref={`/portal/documents/main-campus/${localCollege.slug}`}
      crumbs={[
        { label: "Main Campus", href: "/portal/documents/main-campus" },
        {
          label: college.name,
          href: `/portal/documents/main-campus/${localCollege.slug}`,
        },
        { label: folder.name },
      ]}
    >
      <h1 className="sr-only">
        Documents — {college.name} — {folder.name}
      </h1>
      <DocFileGrid
        files={files.map((f) => ({
          id: f.id,
          title: programs.length > 1 && f.programName ? `${f.programName} — ${f.title}` : f.title,
        }))}
      />
    </DocumentBrowser>
  );
}
