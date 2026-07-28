import { ArrowDownUp, CircleArrowLeft, Monitor } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  PR_ACCREDITATION_FOLDERS,
  PR_COMMON_DOCUMENTS,
  PR_TEMPLATE_SECTIONS,
} from "../data";
import { Button, DocCard, DocTabs, SearchField, ViewToggle } from "../kit";

export type DocsTab = "templates" | "common" | "reports";

const TABS = [
  { key: "templates", label: "Templates", href: "/portal/documents" },
  { key: "common", label: "Common Documents", href: "/portal/documents?tab=common" },
  { key: "reports", label: "AACCUP & COPC Reports", href: "/portal/documents?tab=reports" },
];

/** 4-up grid, 194px tiles on a 27px gutter, inside a 73/69 inset. */
const GRID = "grid grid-cols-4 gap-x-[27px] gap-y-[27px]";

/**
 * Program Representative → Documents. One panel, three tabs, five frames:
 *
 * | frame | state |
 * |---|---|
 * | 02-Documents                    | Templates |
 * | 03-CommonsDocument(NDA)         | Common Documents, NDA not yet signed |
 * | 04-CommonDocuments(NDAFiles)    | Common Documents, unlocked |
 * | 05-AccreditationFiles           | AACCUP & COPC Reports, folder list |
 * | 06-AccreditationFiles&Folders   | AACCUP & COPC Reports, inside a folder |
 *
 * The panel is 1000x659 at y=130; the tab strip sits directly above it and is
 * drawn by `DocTabs`.
 */
export default function ProgramRepDocuments({
  tab = "templates",
  ndaSigned = false,
  folder,
}: {
  tab?: DocsTab;
  /** Common Documents is gated behind a signed NDA — frame 03 vs 04. */
  ndaSigned?: boolean;
  /** Set ⇒ inside a folder on the reports tab (frame 06). */
  folder?: string;
}) {
  return (
    <div className="pl-[95px] pr-[96px] pt-[20px] pb-[22px]">
      <DocTabs tabs={TABS} active={tab} />

      <div className="h-[659px] w-[1000px] rounded-[20px] bg-white shadow-card">
        {tab === "templates" && <TemplatesTab />}
        {tab === "common" && (ndaSigned ? <CommonFilesTab /> : <NdaGate />)}
        {tab === "reports" && <ReportsTab folder={folder} />}
      </div>
    </div>
  );
}

function TemplatesTab() {
  return (
    <div className="px-[73px] pt-[43px]">
      {PR_TEMPLATE_SECTIONS.map((section, i) => (
        <section key={section.title} className={i ? "mt-[42px]" : ""}>
          <h2 className="text-subheading font-semibold leading-none text-black">
            {section.title}
          </h2>
          <div className={`mt-[19px] ${GRID}`}>
            {section.documents.map((d) => (
              <DocCard key={d} title={d} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function CommonFilesTab() {
  return (
    <div className={`px-[73px] pt-[43px] ${GRID}`}>
      {PR_COMMON_DOCUMENTS.map((d, i) => (
        <DocCard key={`${d}-${i}`} title={d} />
      ))}
    </div>
  );
}

/** Frame 03 — the tab is locked until the signed NDA is uploaded. */
function NdaGate() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <p className="text-center text-subheading leading-[24px] text-gray">
        Please upload the signed Non-Disclosure Agreement Form
        <br />
        before you can access the Common Documents.
      </p>

      <Image
        src="/assets/portal/nda-signature.png"
        alt=""
        width={220}
        height={200}
        className="mt-[26px] h-[100px] w-auto object-contain"
      />

      <button
        type="button"
        className="mt-[30px] flex h-[36px] items-center gap-[10px] rounded-[8px] border border-[color:var(--color-gray)]/40 bg-white px-[20px] text-regular leading-none text-gray shadow-card"
      >
        <Monitor className="h-[16px] w-[16px]" strokeWidth={2} aria-hidden />
        Upload from computer
      </button>

      <Link
        href="#"
        className="mt-[16px] flex items-center gap-[6px] text-micro leading-none text-maroon underline"
      >
        <span className="flex h-[11px] w-[11px] items-center justify-center rounded-[2px] bg-[color:var(--color-pdf)] text-[4px] font-bold text-white">
          PDF
        </span>
        Download NDA Form
      </Link>
    </div>
  );
}

/** Frames 05 and 06 — folder list, then the documents inside one. */
function ReportsTab({ folder }: { folder?: string }) {
  return (
    // Reports uses a 54px inset, not Templates' 73 — measured per tab.
    <div className="px-[54px] pt-[42px]">
      <div className="flex h-[43px] items-center">
        <div className="w-[494px]">
          <SearchField />
        </div>
        <div className="ml-auto flex items-center gap-[7px]">
          <ViewToggle />
          <Button variant="solid" icon={ArrowDownUp}>
            Sort
          </Button>
        </div>
      </div>

      {folder ? (
        <>
          <div className="mt-[18px] flex justify-end">
            <Link
              href="/portal/documents?tab=reports"
              className="flex items-center gap-[7px] text-regular leading-none text-gray transition-opacity hover:opacity-70"
            >
              <CircleArrowLeft className="h-[15px] w-[15px]" strokeWidth={2} aria-hidden />
              Back
            </Link>
          </div>
          <div className={`mt-[16px] ${GRID}`}>
            {PR_COMMON_DOCUMENTS.slice(0, 4).map((d, i) => (
              <DocCard key={`${d}-${i}`} title={d} />
            ))}
          </div>
        </>
      ) : (
        <div className="mt-[78px] flex gap-[36px]">
          {PR_ACCREDITATION_FOLDERS.map((f) => (
            <Link
              key={f.label}
              href={`/portal/documents?tab=reports&folder=${encodeURIComponent(f.label)}`}
              className="w-[119px] transition-opacity hover:opacity-80"
            >
              <Image
                src={f.art}
                alt=""
                width={238}
                height={192}
                className="h-[96px] w-[119px] object-contain"
              />
              <span className="mt-[5px] block text-center text-micro leading-[13px] text-black">
                {f.label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
