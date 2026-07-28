import ProgramRepDocuments, {
  type DocsTab,
} from "@/components/portal/screens/ProgramRepDocuments";
import { getCurrentUser } from "@/lib/current-user";
import { CoverCard } from "@/components/portal/kit";
import { DOC_COVER_PREVIEW } from "@/components/portal/data";

/** Documents landing — assets/FIGMA/qac_personnel/02-Documents.png */
const ENTRIES = [
  { label: "MAIN CAMPUS", href: "/portal/documents/main-campus", preview: DOC_COVER_PREVIEW["main-campus"] },
  { label: "CAMPUSES", href: "/portal/documents/campuses", preview: DOC_COVER_PREVIEW.campuses },
];

const TABS: DocsTab[] = ["templates", "common", "reports"];

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; nda?: string; folder?: string }>;
}) {
  const user = await getCurrentUser();
  const { tab, nda, folder } = await searchParams;

  if (user.role === "program_representative") {
    return (
      <ProgramRepDocuments
        tab={TABS.includes(tab as DocsTab) ? (tab as DocsTab) : "templates"}
        ndaSigned={nda === "1"}
        folder={folder}
      />
    );
  }

  return (
    <div className="pt-[118px] pb-[45px] pl-[203.5px] pr-[74px]">
      <p className="w-[851px] text-center text-subheading leading-none text-gray">
        Click the <strong className="font-bold text-maroon">Campus</strong> to see
        all the document files.
      </p>

      <div className="mt-[70px] flex gap-[149px]">
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
