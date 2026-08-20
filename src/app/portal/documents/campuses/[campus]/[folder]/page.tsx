import { notFound } from "next/navigation";
import { DocFileGrid, DocumentBrowser } from "@/components/portal/kit";
import {
  getCampusPrograms,
  getRepositoryFiles,
  getRepositoryFolders,
} from "@/lib/documents";
import { createClient } from "@/lib/supabase/server";

/**
 * assets/FIGMA/qac_personnel/02.5.1.1-...-Sample-Docs.png — the prototype only
 * fills "AACCUP Certificate" with a sample file; `DocFileGrid` draws both the
 * populated and empty states for real, shared with the Program Rep Reports tab
 * and the college branch above.
 *
 * An off-main campus can host more than one programme (see
 * `programs.ts` — Alfonso alone has three), so this reads one folder across
 * every programme at the campus, each file labelled with its programme.
 */
export default async function CampusFolderPage({
  params,
}: {
  params: Promise<{ campus: string; folder: string }>;
}) {
  const { campus: campusSlug, folder: folderSlug } = await params;

  const supabase = await createClient();
  const [{ data: campus }, folders, programs] = await Promise.all([
    supabase.from("campuses").select("slug, name, is_main").eq("slug", campusSlug).maybeSingle(),
    getRepositoryFolders(null),
    getCampusPrograms(campusSlug),
  ]);
  const folder = folders.find((f) => f.slug === folderSlug);
  if (!campus || campus.is_main || !folder) notFound();

  const files = programs.length
    ? await getRepositoryFiles(
        programs.map((p) => p.id),
        folder.id,
      )
    : [];

  return (
    <DocumentBrowser
      backHref={`/portal/documents/campuses/${campus.slug}`}
      crumbs={[
        { label: "Campuses", href: "/portal/documents/campuses" },
        { label: campus.name, href: `/portal/documents/campuses/${campus.slug}` },
        { label: folder.name },
      ]}
    >
      <h1 className="sr-only">
        Documents — {campus.name} — {folder.name}
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
