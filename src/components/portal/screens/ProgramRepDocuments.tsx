import { Download } from "lucide-react";
import Image from "next/image";
import { PR_LEVEL_CARDS, PR_LEVEL_TEMPLATES } from "../data";
import { BackLink, CoverCard, DocCard, DocTabs } from "../kit";
import NdaUpload from "./NdaUpload";
import RepReportsBrowser, { type ReportsFile, type ReportsFolder } from "./RepReportsBrowser";

/** One common document, as read from the database. */
export type CommonDocument = { id: string; title: string };

export type DocsTab = "templates" | "common" | "reports";

const TABS = [
  { key: "templates", label: "Templates", href: "/portal/documents" },
  { key: "common", label: "Common Documents", href: "/portal/documents?tab=common" },
  { key: "reports", label: "AACCUP & COPC Reports", href: "/portal/documents?tab=reports" },
];

/** 4-up grid, 194px tiles on a 27px gutter, inside a 73/69 inset. */
// Fixed 194px columns (DocCard's own width) rather than `1fr` tracks — `1fr`
// stretches to fill the row, which is what left a partial last row of cards
// stranded at the left edge instead of centered under `justify-center`.
const GRID = "grid grid-cols-[repeat(4,194px)] justify-center gap-x-[27px] gap-y-[27px]";

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
 * Templates and Common Documents are view-only for a representative, so their
 * tiles carry no ⋮ menu (client, 2026-09-27).
 *
 * The panel was a fixed 1000x659; it's now `w-full max-w-[var(--content-max)]`
 * (client request: don't strand it small on a wide monitor) with a 659px
 * `min-h`. The tab strip sits directly above it and is drawn by `DocTabs`,
 * which tracks the same fluid width — see that component's own note.
 */
export default function ProgramRepDocuments({
  tab = "templates",
  level,
  ndaSigned = false,
  commonDocuments = [],
  reports,
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
  commonDocuments?: CommonDocument[];
  reports?: {
    programId: string | null;
    folders: ReportsFolder[];
    folder: ReportsFolder | null;
    files: ReportsFile[];
  };
}) {
  return (
    <div className="flex flex-col items-center pt-[20px] pb-[22px]">
      <DocTabs tabs={TABS} active={tab} />

      {/* `min-h`, not a fixed `h` — a tall level grid (Level III's 7 cards
          across two sections) needs to grow the panel rather than spill its
          last row past the rounded corners. `flex flex-col` gives the
          `h-full`/`flex-1` centering used by the empty NDA/common-docs states
          something to resolve against — a `min-h`-only block parent has no
          definite height, so a percentage-height child collapses to its
          content size and sits pinned at the top instead of centering. */}
      <div
        className="flex w-full min-h-[659px] min-w-[1000px] flex-col rounded-[20px] bg-white shadow-card"
        style={{ maxWidth: "var(--content-max)" }}
      >
        {tab === "templates" && <TemplatesTab level={level} />}
        {tab === "common" &&
          (ndaSigned ? <CommonFilesTab documents={commonDocuments} /> : <NdaGate />)}
        {tab === "reports" && reports && <RepReportsBrowser {...reports} />}
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
        <h2 className="text-subheading font-bold leading-none text-black">{entry.heading}</h2>
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

function NdaFormLink() {
  return (
    <a
      href="/api/documents/nda-template"
      className="flex items-center gap-[6px] text-regular leading-none text-maroon underline"
    >
      <Download className="h-[13px] w-[13px]" strokeWidth={2.5} aria-hidden />
      Download NDA Form
    </a>
  );
}

function CommonFilesTab({ documents }: { documents: CommonDocument[] }) {
  return (
    <div className="flex flex-1 flex-col px-[73px] pb-[43px] pt-[30px]">
      <div className="flex justify-end">
        <NdaFormLink />
      </div>
      {documents.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-subheading text-gray">
            No common documents have been published yet.
          </p>
        </div>
      ) : (
        <div className={`mt-[20px] ${GRID}`}>
          {documents.map((d) => (
            <DocCard
              key={d.id}
              title={d.title}
              href={`/api/documents/download?source=common&id=${d.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Frame 03 — locked until a signed, notarized NDA passes `uploadNda`'s checks. */
function NdaGate() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-[30px]">
      <p className="text-center text-subheading leading-[24px] text-gray">
        Please upload the signed and notarized Non-Disclosure Agreement Form
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
    </div>
  );
}
