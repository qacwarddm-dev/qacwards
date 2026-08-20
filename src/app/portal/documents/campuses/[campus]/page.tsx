import { notFound } from "next/navigation";
import { DOCUMENT_FOLDERS } from "@/components/portal/data";
import { DocumentBrowser, FolderGrid } from "@/components/portal/kit";
import { createClient } from "@/lib/supabase/server";

/** assets/FIGMA/qac_personnel/02.5.1-Documents-Campuses-Alfonso,Cavite.png */
export default async function CampusPage({
  params,
}: {
  params: Promise<{ campus: string }>;
}) {
  const { campus: slug } = await params;

  const supabase = await createClient();
  const { data: campus } = await supabase
    .from("campuses")
    .select("slug, name, is_main")
    .eq("slug", slug)
    .maybeSingle();
  if (!campus || campus.is_main) notFound();

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
