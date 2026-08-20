import { notFound } from "next/navigation";
import { COLLEGES, DOCUMENT_FOLDERS } from "@/components/portal/data";
import { DocumentBrowser, FolderGrid } from "@/components/portal/kit";
import { createClient } from "@/lib/supabase/server";

/** assets/FIGMA/qac_personnel/02.6.1-Document-MainCampus-CollegeofAccountancyandFinance.png */
export default async function CollegePage({
  params,
}: {
  params: Promise<{ college: string }>;
}) {
  const { college: slug } = await params;
  // The route's own slug ("cadbe") is the college's real `code` lower-cased —
  // `COLLEGES` (data.ts) still supplies the display name/badge, which are
  // decorative and match the seed exactly; the code itself is checked against
  // the database so a college that does not exist there 404s here too.
  const localCollege = COLLEGES.find((c) => c.slug === slug);
  if (!localCollege) notFound();

  const supabase = await createClient();
  const { data: college } = await supabase
    .from("colleges")
    .select("id, code, name")
    .eq("code", slug.toUpperCase())
    .maybeSingle();
  if (!college) notFound();

  return (
    <DocumentBrowser
      backHref="/portal/documents/main-campus"
      crumbs={[
        { label: "Main Campus", href: "/portal/documents/main-campus" },
        { label: localCollege.name },
      ]}
    >
      <h1 className="sr-only">Documents — {localCollege.name}</h1>
      <FolderGrid
        entries={DOCUMENT_FOLDERS}
        hrefFor={(f) => `/portal/documents/main-campus/${localCollege.slug}/${f.slug}`}
      />
    </DocumentBrowser>
  );
}
