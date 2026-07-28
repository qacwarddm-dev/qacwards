import { Check, Download, X } from "lucide-react";
import {
  IA_COMPLIANCE_AREAS,
  IA_EVALUATION_WEBSITE,
  IA_EVALUATION_WEBSITE_DONE,
  IA_EVALUATIONS,
  IA_NARRATIVE_DOCS,
} from "../data";
import { Button, type Column, DataTable, Panel, PdfChip } from "../kit";

/**
 * Internal Accreditor → Evaluation → per-document sheet.
 *
 * assets/FIGMA/internal_accreditor/03.1-DocumentEvaluation.png (`review`) and
 * 03.2 (`done`). **Both frames are 1x exports (1440x809), so — unlike every
 * other screen — this one is transcribed by eye and cannot be diffed against
 * the prototype.** It is flagged for the owner to re-export at 2x; treat its
 * spacing as provisional.
 *
 * The two states differ only at the edges: `review` shows a per-document
 * accept/reject and an empty Score box on the first row, and a single "Ready
 * for SV" button; `done` drops the accept/reject controls, swaps the website,
 * and offers "Return" + "Evaluate".
 */
const SUMMARY_COLUMNS: Column[] = [
  { key: "campus", header: "Campus", width: "w-[150px]" },
  { key: "college", header: "College", width: "w-[140px]" },
  { key: "program", header: "Program", width: "flex-1" },
  { key: "level", header: "Level", width: "w-[130px]" },
  { key: "accreditor", header: "Accreditor Assigned", width: "w-[190px]" },
  { key: "score", header: "Score", width: "w-[150px]" },
];

function AcceptReject() {
  return (
    <span className="flex items-center gap-[12px]">
      <Check className="h-[16px] w-[16px] text-yellow" strokeWidth={3} aria-hidden />
      <X className="h-[16px] w-[16px] text-maroon" strokeWidth={3} aria-hidden />
    </span>
  );
}

function DocRow({
  label,
  file,
  trailing,
  labelWidth = 135,
}: {
  label: string;
  file: string;
  trailing?: React.ReactNode;
  /** Narrative/Best-Practice labels are long (135); Area labels are short. */
  labelWidth?: number;
}) {
  return (
    <div className="flex h-[30px] items-center gap-[14px]">
      <span
        className="shrink-0 text-regular leading-none text-black"
        style={{ width: labelWidth }}
      >
        {label}
      </span>
      <span className="shrink-0 text-regular leading-none text-black">:</span>
      <PdfChip name={file} />
      {trailing}
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-subheading font-bold uppercase leading-none text-black">
      {children}
    </h2>
  );
}

export default function InternalAccreditorEvaluationDetail({
  state = "review",
}: {
  state?: "review" | "done";
}) {
  const e = IA_EVALUATIONS[0];
  const review = state === "review";

  const summary = [
    {
      id: e.id,
      cells: {
        campus: e.campus,
        college: e.college,
        program: <span className="block truncate">{e.program}</span>,
        level: e.level,
        accreditor: e.accreditor,
        score: <span className="italic text-gray">{e.score}</span>,
      },
    },
  ];

  const accept = review ? <AcceptReject /> : undefined;
  const scoreBox = review ? (
    <span className="flex h-[24px] w-[70px] shrink-0 items-center justify-center rounded-[6px] border border-[color:var(--color-gray)]/40 text-[9px] leading-none text-gray">
      Score
    </span>
  ) : undefined;

  return (
    <div className="pb-[50px] pl-[54px] pr-[52px] pt-[50px]">
      <Panel
        title="Document Evaluation"
        action={
          <button
            type="button"
            className="flex items-center gap-[8px] text-subheading font-semibold leading-none text-maroon transition-opacity hover:opacity-70"
          >
            <Download className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            Download Accreditation Visit Evaluation Form
          </button>
        }
        footer={
          review ? (
            <Button variant="muted" size="lg">
              Ready for SV
            </Button>
          ) : (
            <span className="flex gap-[16px]">
              <Button variant="outline" size="lg">
                Return
              </Button>
              <Button variant="solid" size="lg">
                Evaluate
              </Button>
            </span>
          )
        }
      >
        <DataTable columns={SUMMARY_COLUMNS} rows={summary} />

        <div className="mt-[40px] grid grid-cols-2 gap-x-[40px] gap-y-[48px]">
          {/* Left column: Narrative Report, then Best Practice. */}
          <section className="flex flex-col gap-[18px]">
            <Heading>Narrative Report</Heading>
            <div>
              {IA_NARRATIVE_DOCS.map((label, i) => (
                <DocRow
                  key={label}
                  label={label}
                  file={`${label} (Narrative Report)`}
                  trailing={i === 0 ? scoreBox : accept}
                />
              ))}
            </div>
          </section>

          {/* Right column: Compliance Report (two sub-columns of five). */}
          <section className="flex flex-col gap-[18px]">
            <Heading>Compliance Report</Heading>
            <div className="grid grid-cols-2 gap-x-[30px]">
              {[IA_COMPLIANCE_AREAS.slice(0, 5), IA_COMPLIANCE_AREAS.slice(5)].map(
                (col, ci) => (
                  <div key={ci}>
                    {col.map((area) => (
                      <DocRow
                        key={area}
                        label={area}
                        file={area}
                        labelWidth={52}
                        trailing={accept}
                      />
                    ))}
                  </div>
                ),
              )}
            </div>
          </section>

          <section className="flex flex-col gap-[18px]">
            <Heading>Best Practice</Heading>
            <div>
              {IA_NARRATIVE_DOCS.map((label) => (
                <DocRow
                  key={label}
                  label={label}
                  file={`${label} (Best Practice)`}
                  trailing={accept}
                />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-[18px]">
            <Heading>Website</Heading>
            <div className="flex h-[30px] items-center gap-[14px]">
              <span className="flex h-[30px] flex-1 items-center rounded-[8px] border border-maroon px-[14px] text-regular leading-none text-black">
                {review ? IA_EVALUATION_WEBSITE : IA_EVALUATION_WEBSITE_DONE}
              </span>
              {accept}
            </div>
          </section>
        </div>
      </Panel>
    </div>
  );
}
