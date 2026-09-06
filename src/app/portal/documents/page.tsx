import ProgramRepDocuments, {
  type DocsTab,
} from "@/components/portal/screens/ProgramRepDocuments";
import { requireCurrentUser } from "@/lib/current-user";
import { CoverCard } from "@/components/portal/kit";
import { DOC_COVER_PREVIEW } from "@/components/portal/data";
import { getCommonDocuments, getRepositoryFiles, getRepositoryFolders, hasNda } from "@/lib/documents";
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

    // `?nda=1` used to fake the unlocked state for the static screens. The real
    // answer is a row in `ndas`, and the query param is gone — a URL cannot let
    // anyone past the gate, which was always an RLS policy underneath.
    void nda;
    const ndaSigned = activeTab === "common" ? await hasNda() : false;
    const commonDocuments = ndaSigned ? await getCommonDocuments() : [];

    let repositoryFiles: { id: string; title: string }[] = [];
    if (activeTab === "reports" && folder) {
      const [programs, folders] = await Promise.all([
        getMyPrograms(),
        getRepositoryFolders(null),
      ]);
      const folderRow = folders.find((f) => f.slug === folder);
      // A representative can hold several programmes; the repository tree is
      // per programme, so this shows the first until the picker lands.
      const programId = programs[0]?.id ?? null;
      if (folderRow && programId) {
        repositoryFiles = (await getRepositoryFiles(programId, folderRow.id)).map((f) => ({
          id: f.id,
          title: f.title,
        }));
      }
    }

    return (
      <>
        <h1 className="sr-only">Documents</h1>
        <ProgramRepDocuments
          tab={activeTab}
          level={level}
          ndaSigned={ndaSigned}
          folder={folder}
          commonDocuments={commonDocuments.map((d) => ({ id: d.id, title: d.title }))}
          repositoryFiles={repositoryFiles}
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
