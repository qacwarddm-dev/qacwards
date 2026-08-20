import { ArrowDownUp, CircleArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  PR_ACCREDITATION_FOLDERS,
  PR_LEVEL_CARDS,
  PR_LEVEL_TEMPLATES,
} from "../data";
import { BackLink, Button, CoverCard, DocCard, DocFileGrid, DocTabs, SearchField, ViewToggle } from "../kit";
import NdaUpload from "./NdaUpload";

/** One common document, as read from the database. */
export type CommonDocument = { id: string; title: string };

/** One file inside an AACCUP/COPC repository folder. */
export type RepositoryFile = { id: string; title: string };

export type DocsTab = "templates" | "common" | "reports";

const TABS = [
  { key: "templates", label: "Templates", href: "/portal/documents" },
  { key: "common", label: "Common Documents", href: "/portal/documents?tab=common" },
  { key: "reports", label: "AACCUP & COPC Reports", href: "/portal/documents?tab=reports" },
];

/** 4-up grid, 194px tiles on a 27px gutter, inside a 73/69 inset. */
const GRID = "grid grid-cols-4 gap-x-[27px] gap-y-[27px]";

/**
 * Program Representative → Documents. One panel, three tabs:
 *
 * | frame | state |
 * |---|---|
 * | 02-Documents                    | Templates, level selector |
 * | 02.01-HoverState                | Templates, level card hover panel |
 * | 02.1-PSV-LVL2 / 02.2-LVL3 / 02.3-LVL4 | Templates, inside a level |
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
  level,
  ndaSigned = false,
  folder,
  commonDocuments = [],
  repositoryFiles = [],
}: {
  tab?: DocsTab;
  /** Set ⇒ inside one of the three `PR_LEVEL_TEMPLATES` grids (02.1–02.3). */
  level?: string;
  /**
   * Frame 03 vs 04. This only chooses which panel is drawn — the gate itself is
   * an RLS policy on `common_documents` plus one on the `common-docs` bucket, so
   * a user without an NDA gets an empty list and cannot fetch a file whose path
   * they already know. UI hiding is not access control (§B10).
   */
  ndaSigned?: boolean;
  /** Set ⇒ inside a folder on the reports tab (frame 06). */
  folder?: string;
  commonDocuments?: CommonDocument[];
  repositoryFiles?: RepositoryFile[];
}) {
  return (
    <div className="pl-[95px] pr-[96px] pt-[20px] pb-[22px]">
      <DocTabs tabs={TABS} active={tab} />

      {/* `min-h`, not a fixed `h` — a tall level grid (Level III's 7 cards
          across two sections) needs to grow the panel rather than spill its
          last row past the rounded corners. */}
      <div className="min-h-[659px] w-[1000px] rounded-[20px] bg-white shadow-card">
        {tab === "templates" && <TemplatesTab level={level} />}
        {tab === "common" &&
          (ndaSigned ? <CommonFilesTab documents={commonDocuments} /> : <NdaGate />)}
        {tab === "reports" && <ReportsTab folder={folder} files={repositoryFiles} />}
      </div>
    </div>
  );
}

/** Frame 02.1/02.2/02.3 — the document grid inside one accreditation level. */
function LevelTemplatesTab({ level }: { level: string }) {
  const entry = PR_LEVEL_TEMPLATES[level];
  if (!entry) return null;

  return (
    <div className="px-[73px] pb-[43px] pt-[43px]">
      <div className="relative flex h-[24px] items-center justify-center">
        <h2 className="text-heading font-bold leading-none text-black">{entry.heading}</h2>
        <span className="absolute right-0">
          <BackLink href="/portal/documents" />
        </span>
      </div>

      {entry.sections.map((section, i) => (
        <section key={section.title ?? i} className={i ? "mt-[42px]" : "mt-[34px]"}>
          {section.title && (
            <h3 className="text-subheading font-semibold leading-none text-black">
              {section.title}
            </h3>
          )}
          <div className={`${section.title ? "mt-[19px]" : ""} ${GRID}`}>
            {section.documents.map((d) => (
              <DocCard key={d} title={d} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function TemplatesTab({ level }: { level?: string }) {
  if (level) return <LevelTemplatesTab level={level} />;

  return (
    <div className="px-[73px] pb-[43px] pt-[43px]">
      <p className="text-center text-regular leading-none text-gray">
        Click the <strong className="font-bold text-maroon">Accreditation Level</strong> to see
        all the document templates.
      </p>

      <div className="mt-[45px] flex justify-center gap-[36px]">
        {PR_LEVEL_CARDS.map((c) => (
          <CoverCard
            key={c.key}
            variant="level"
            label={c.label}
            href={`/portal/documents?level=${c.key}`}
            image="/assets/portal/documents-cover.jpg"
            ctaLabel="View Templates"
            preview={
              <>
                <span>{c.description}</span>
                <span className="mt-[14px] block font-bold">{c.total}</span>
                <span className="mt-[6px] block whitespace-pre-line">{c.breakdown}</span>
              </>
            }
          />
        ))}
      </div>
    </div>
  );
}

function CommonFilesTab({ documents }: { documents: CommonDocument[] }) {
  if (documents.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-subheading text-gray">
          No common documents have been published yet.
        </p>
      </div>
    );
  }

  return (
    <div className={`px-[73px] pb-[43px] pt-[43px] ${GRID}`}>
      {documents.map((d) => (
        <DocCard
          key={d.id}
          title={d.title}
          href={`/api/documents/download?source=common&id=${d.id}`}
        />
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

      <NdaUpload />

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
function ReportsTab({
  folder,
  files,
}: {
  folder?: string;
  files: RepositoryFile[];
}) {
  return (
    // Reports uses a 54px inset, not Templates' 73 — measured per tab.
    <div className="px-[54px] pb-[42px] pt-[42px]">
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
          <DocFileGrid files={files} />
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
