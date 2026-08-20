"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, X } from "lucide-react";
import type { AssignmentDetail } from "@/lib/assignments";
import { decideItem, markReadyForSurveyVisit } from "@/lib/assignment-actions";
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
 * B9/task 2 made this the fetching half: `detail` and `items` come from
 * `getAssignmentDetail()` / `getEvaluation()`, seeded on first open by
 * `ensureEvaluation` + `ensureEvaluationItems`
 * (`/portal/evaluation/[id]/page.tsx`).
 *
 * The frame's "Best Practice" section is not reproduced — there is no column
 * anywhere that distinguishes a Best Practice document from a Narrative
 * Report one, only phase-linked vs requirement-area-linked (see the comment
 * on `ensureEvaluationItems`). "Evaluate" / "Return" are left unwired: both
 * frames draw them with no score/remarks input, and inventing that form
 * would be UI the Figma export does not draw.
 */
type EvalItem = {
  id: string;
  kind: string;
  label: string;
  decision: string;
  submission_document_id: string | null;
  requirement_area_id: string | null;
};

const SUMMARY_COLUMNS: Column[] = [
  { key: "campus", header: "Campus", width: "w-[150px]" },
  { key: "college", header: "College", width: "w-[140px]" },
  { key: "program", header: "Program", width: "flex-1" },
  { key: "level", header: "Level", width: "w-[130px]" },
  { key: "accreditor", header: "Accreditor Assigned", width: "w-[190px]" },
  { key: "score", header: "Score", width: "w-[150px]" },
];

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-subheading font-bold uppercase leading-none text-black">{children}</h2>
  );
}

export default function InternalAccreditorEvaluationDetail({
  state = "review",
  detail,
  items,
  score,
}: {
  state?: "review" | "done";
  detail: AssignmentDetail;
  items: EvalItem[];
  score: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const review = state === "review";

  function decide(itemId: string, decision: "approved" | "disapproved") {
    startTransition(async () => {
      await decideItem(itemId, decision);
      router.refresh();
    });
  }

  function readyForSv() {
    startTransition(async () => {
      await markReadyForSurveyVisit(detail.id);
      router.refresh();
    });
  }

  const summary = [
    {
      id: detail.id,
      cells: {
        campus: detail.campus,
        college: detail.college,
        program: <span className="block truncate">{detail.program}</span>,
        level: detail.level,
        accreditor: detail.accreditor,
        score: <span className="italic text-gray">{score}</span>,
      },
    },
  ];

  const narrativeItems = items.filter((i) => i.kind === "narrative");
  const complianceItems = items.filter((i) => i.kind === "compliance_area");
  const websiteItem = items.find((i) => i.kind === "website");

  function DecisionRow({ label, item }: { label: string; item: EvalItem }) {
    return (
      <div className="flex h-[30px] items-center gap-[14px]">
        <span className="shrink-0 text-regular leading-none text-black" style={{ width: 135 }}>
          {label}
        </span>
        <span className="shrink-0 text-regular leading-none text-black">:</span>
        <PdfChip name={label} />
        <span className="flex items-center gap-[12px]">
          <button
            type="button"
            disabled={pending}
            aria-label="Approve"
            onClick={() => decide(item.id, "approved")}
            className={item.decision === "approved" ? "" : "opacity-30"}
          >
            <Check className="h-[16px] w-[16px] text-yellow" strokeWidth={3} aria-hidden />
          </button>
          <button
            type="button"
            disabled={pending}
            aria-label="Disapprove"
            onClick={() => decide(item.id, "disapproved")}
            className={item.decision === "disapproved" ? "" : "opacity-30"}
          >
            <X className="h-[16px] w-[16px] text-maroon" strokeWidth={3} aria-hidden />
          </button>
        </span>
      </div>
    );
  }

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
            <Button
              variant="muted"
              size="lg"
              disabled={pending || detail.status !== "in_progress"}
              onClick={readyForSv}
            >
              Ready for SV
            </Button>
          ) : (
            <span className="flex gap-[16px]">
              <Button variant="outline" size="lg" disabled>
                Return
              </Button>
              <Button variant="solid" size="lg" disabled>
                Evaluate
              </Button>
            </span>
          )
        }
      >
        <DataTable columns={SUMMARY_COLUMNS} rows={summary} />

        <div className="mt-[40px] grid grid-cols-2 gap-x-[40px] gap-y-[48px]">
          <section className="flex flex-col gap-[18px]">
            <Heading>Narrative Report</Heading>
            <div>
              {narrativeItems.length > 0 ? (
                narrativeItems.map((item) => (
                  <DecisionRow key={item.id} label={item.label} item={item} />
                ))
              ) : (
                <p className="text-regular text-gray">No phase documents uploaded yet.</p>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-[18px]">
            <Heading>Compliance Report</Heading>
            <div className="grid grid-cols-2 gap-x-[30px]">
              {complianceItems.length > 0 ? (
                complianceItems.map((item) => (
                  <DecisionRow key={item.id} label={item.label} item={item} />
                ))
              ) : (
                <p className="text-regular text-gray">No area documents uploaded yet.</p>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-[18px]">
            <Heading>Website</Heading>
            {websiteItem ? (
              <div className="flex h-[30px] items-center gap-[14px]">
                <span className="flex h-[30px] flex-1 items-center rounded-[8px] border border-maroon px-[14px] text-regular leading-none text-black">
                  {detail.websiteUrl}
                </span>
                <span className="flex items-center gap-[12px]">
                  <button
                    type="button"
                    disabled={pending}
                    aria-label="Approve"
                    onClick={() => decide(websiteItem.id, "approved")}
                    className={websiteItem.decision === "approved" ? "" : "opacity-30"}
                  >
                    <Check className="h-[16px] w-[16px] text-yellow" strokeWidth={3} aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    aria-label="Disapprove"
                    onClick={() => decide(websiteItem.id, "disapproved")}
                    className={websiteItem.decision === "disapproved" ? "" : "opacity-30"}
                  >
                    <X className="h-[16px] w-[16px] text-maroon" strokeWidth={3} aria-hidden />
                  </button>
                </span>
              </div>
            ) : (
              <p className="text-regular text-gray">No website submitted.</p>
            )}
          </section>
        </div>
      </Panel>
    </div>
  );
}
