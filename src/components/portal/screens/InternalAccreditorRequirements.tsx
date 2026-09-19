"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AssignmentRequirements } from "@/lib/assignments";
import type { Stat } from "@/components/portal/kit";
import { markReadyForSurveyVisit } from "@/lib/assignment-actions";
import { Breadcrumb, Button, EvaluationSummary, Panel, ProgressRow, RowList } from "../kit";

/** Same three statuses `InternalAccreditorEvaluationDetail`'s `SIGNED_OFF`
 *  uses for its own footer gate — kept in sync by hand, not shared, since
 *  the two screens' footers differ in everything else. */
const SIGNED_OFF = ["for_psv", "evaluated", "score_returned"];

export default function InternalAccreditorRequirements({
  assignmentId,
  stats,
  data,
}: {
  assignmentId: string;
  stats: Stat[];
  data: AssignmentRequirements;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { detail, areas, readiness } = data;
  const signedOff = SIGNED_OFF.includes(detail.status);

  function approve() {
    startTransition(async () => {
      await markReadyForSurveyVisit(assignmentId);
      router.refresh();
    });
  }

  const half = Math.ceil(areas.length / 2);
  const left = areas.slice(0, half);
  const right = areas.slice(half);

  return (
    <div className="pb-[50px] pl-[54px] pr-[52px] pt-[50px]">
      <EvaluationSummary stats={stats} />

      <div className="mb-[14px] mt-[26px] pl-[4px]">
        <Breadcrumb
          items={[{ label: "Programs", href: "/portal/evaluation" }, { label: "Requirements" }]}
          variant="trail"
        />
      </div>

      <Panel
        title="Accreditation Requirements"
        action={
          !signedOff ? (
            <span className="flex items-center gap-[10px]">
              <span className="h-[8px] w-[140px] shrink-0 rounded-full bg-surface">
                <span
                  className="block h-full rounded-full bg-yellow"
                  style={{ width: `${readiness}%` }}
                />
              </span>
              <span className="text-subheading font-semibold leading-none text-black">
                {readiness}%
              </span>
            </span>
          ) : undefined
        }
        back={{ href: "/portal/evaluation", to: "Programs" }}
        footer={
          signedOff ? (
            <Button variant="solid" size="lg" disabled>
              Evaluate
            </Button>
          ) : (
            <span className="flex gap-[16px]">
              <Button variant="secondary" size="lg" href="/portal/evaluation">
                Return
              </Button>
              <Button
                variant="primary"
                size="lg"
                disabled={pending || detail.status !== "in_progress"}
                onClick={approve}
              >
                Approve
              </Button>
            </span>
          )
        }
      >
        <div className="flex gap-[24px]">
          {[left, right].map((col, i) => (
            <div key={i} className="flex-1">
              <RowList>
                {col.map((area) => (
                  <ProgressRow
                    key={area.id}
                    label={area.isOptional ? `${area.name} (optional)` : area.name}
                    marker={false}
                    href={`/portal/evaluation/${assignmentId}?modal=add&area=${area.id}`}
                  />
                ))}
              </RowList>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
