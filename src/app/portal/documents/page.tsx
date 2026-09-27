import ProgramRepDocuments, {
  type DocsTab,
} from "@/components/portal/screens/ProgramRepDocuments";
import { requireCurrentUser } from "@/lib/current-user";
import { CoverCard } from "@/components/portal/kit";
import { DOC_COVER_PREVIEW } from "@/components/portal/data";
import { getCommonDocuments, getRepFolders, getRepositoryFiles, hasNda } from "@/lib/documents";
import { getMyPrograms } from "@/lib/submissions";

/** Documents landing — assets/FIGMA/qac_personnel/02-Documents.png */
const ENTRIES = [
  { label: "MAIN CAMPUS", href: "/portal/documents/main-campus", preview: DOC_COVER_PREVIEW["main-campus"] },
  { label: "CAMPUSES", href: "/portal/documents/campuses", preview: DOC_COVER_PREVIEW.campuses },
];

const TABS: DocsTab[] = ["templates", "common", "reports"];

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; level?: string; nda?: string; folder?: string }>;
}) {
  const user = await requireCurrentUser();
  const { tab, level, nda, folder } = await searchParams;

  if (user.role === "program_representative") {
    const activeTab = TABS.includes(tab as DocsTab) ? (tab as DocsTab) : "templates";

    void nda;
    const ndaSigned = activeTab === "common" ? await hasNda() : false;
    const commonDocuments = ndaSigned ? await getCommonDocuments() : [];

    let reports;
    if (activeTab === "reports") {
      // A representative can hold several programmes; the repository tree is
      // per programme, so this shows the first until the picker lands.
      const programId = (await getMyPrograms())[0]?.id ?? null;
      const folders = programId ? await getRepFolders(programId) : [];
      const current = folders.find((f) => f.slug === folder) ?? null;
      const files =
        current && programId ? await getRepositoryFiles(programId, current.id) : [];

      reports = {
        programId,
        folders: folders.map((f) => ({
          id: f.id,
          slug: f.slug,
          name: f.displayName,
          fileCount: f.fileCount,
          lastModified: f.lastModified,
        })),
        folder: current && {
          id: current.id,
          slug: current.slug,
          name: current.displayName,
          fileCount: current.fileCount,
          lastModified: current.lastModified,
        },
        files: files.map((f) => ({
          id: f.id,
          title: f.title,
          owner: f.ownerName,
          createdAt: f.created_at,
          size: f.file_size,
        })),
      };
    }

    return (
      <>
        <h1 className="sr-only">Documents</h1>
        <ProgramRepDocuments
          tab={activeTab}
          level={level}
          ndaSigned={ndaSigned}
          commonDocuments={commonDocuments.map((d) => ({ id: d.id, title: d.title }))}
          reports={reports}
        />
      </>
    );
  }

  return (
    <div className="pt-[118px] pb-[45px] pl-[203.5px] pr-[74px]">
      <h1 className="sr-only">Documents</h1>
      <p className="text-center text-subheading leading-none text-gray">
        Click the <strong className="font-bold text-maroon">Campus</strong> to see
        all the document files.
      </p>

      <div className="mt-[70px] flex justify-center gap-[149px]">
        {ENTRIES.map((e) => (
          <CoverCard
            key={e.href}
            label={e.label}
            href={e.href}
            image="/assets/portal/documents-cover.jpg"
            preview={e.preview}
          />
        ))}
      </div>
    </div>
  );
}
