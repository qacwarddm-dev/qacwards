import type { AssignmentRequirements } from "@/lib/assignments";
import { formatLongDate } from "@/lib/evaluation-sheet";
import { ASSIGNMENT_STEPS } from "../data";
import {
  AreaGrid,
  Breadcrumb,
  EvaluationSummary,
  FieldLabel,
  Panel,
  ReadinessBar,
  type Stat,
  StatusPill,
  type StatusKey,
  Stepper,
} from "../kit";
import AssignmentReassign from "./AssignmentReassign";
import SiteVisitDateEditor from "./SiteVisitDateEditor";

// `ASSIGNMENT_STEPS`' five labels match `assignment_status`'s five progressing
// values one-for-one; `declined` is off the track, so it has no step done.
const STATUS_ORDER = ["assigned", "in_progress", "for_psv", "evaluated", "score_returned"];

const RESPONSE_LABEL: Record<string, string> = {
  pending: "Awaiting response",
  accepted: "Accepted",
  rejected: "Declined",
};

/**
 * QAC Personnel → Accreditation → one programme's Requirements
 * (docs/qac_per.pdf, page 2): the areas the programme submits to, each opening
 * the files it uploaded there (`?area=`). The Assignment panel under it keeps
 * what the old assignment table carried per row — team responses, Reassign,
 * the site visit date, the progress track — since the Programs list no longer
 * has room for them.
 */
export default function QacPersonnelAccreditationDetail({
  assignmentId,
  summary,
  data,
}: {
  assignmentId: string;
  summary: Stat[];
  data: AssignmentRequirements;
}) {
  const { detail, areas, readiness } = data;
  const team = detail.signatories;
  const accepted = team.filter((m) => m.response === "accepted").length;
  const declined = team.filter((m) => m.response === "rejected");
  const needsReassignment =
    detail.status === "declined" || (declined.length > 0 && accepted === 0);
  const at = STATUS_ORDER.indexOf(detail.status);

  return (
    <div className="px-[var(--page-gutter)] pb-[50px] pt-[50px] lg:pl-[54px] lg:pr-[52px]">
      <EvaluationSummary title="Accreditation Summary" stats={summary} />

      <div className="mb-[14px] mt-[26px] pl-[4px]">
        <Breadcrumb
          items={[{ label: "Programs", href: "/portal/assignment" }, { label: "Requirements" }]}
          variant="trail"
        />
      </div>

      <Panel
        title={detail.program}
        action={<ReadinessBar percent={readiness} size="heading" />}
      >
        {areas.length > 0 ? (
          <AreaGrid
            areas={areas.map((area) => ({
              id: area.id,
              label: area.isOptional ? `${area.name} (optional)` : area.name,
              href: `/portal/assignment/${assignmentId}?area=${area.id}`,
            }))}
          />
        ) : (
          <p className="px-[4px] py-[10px] text-regular text-gray">
            {detail.level} has no requirement areas.
          </p>
        )}
      </Panel>

      <div className="mt-[26px]">
        <Panel title="Assignment" back={{ href: "/portal/assignment", to: "Programs" }}>
          <dl className="grid grid-cols-2 gap-[24px] lg:grid-cols-4">
            <div>
              <dt><FieldLabel>Campus</FieldLabel></dt>
              <dd className="mt-[10px] text-regular text-black">{detail.campus}</dd>
            </div>
            <div>
              <dt><FieldLabel>Level</FieldLabel></dt>
              <dd className="mt-[10px] text-regular text-black">{detail.level}</dd>
            </div>
            <div>
              <dt><FieldLabel>Deadline</FieldLabel></dt>
              <dd className="mt-[10px] text-regular text-black">
                {detail.dueDate ? formatLongDate(detail.dueDate) : "Not set"}
              </dd>
            </div>
            <div>
              <dt><FieldLabel>Status</FieldLabel></dt>
              <dd className="mt-[8px]">
                <StatusPill status={detail.status as StatusKey} size="sm" />
              </dd>
            </div>
          </dl>

          <div className="mt-[28px] flex flex-wrap items-start justify-between gap-[24px]">
            <div>
              <FieldLabel>Internal Accreditors</FieldLabel>
              <ul className="mt-[10px] flex flex-col gap-[8px]">
                {team.length > 0 ? (
                  team.map((m) => (
                    <li key={m.id} className="text-regular text-black">
                      {m.name}
                      <span className="ml-[10px] text-gray">
                        {RESPONSE_LABEL[m.response] ?? m.response}
                        {m.note ? ` — “${m.note}”` : ""}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="text-regular italic text-gray">No team yet</li>
                )}
              </ul>
              {needsReassignment && (
                <div className="mt-[14px]">
                  <AssignmentReassign
                    assignmentId={assignmentId}
                    declined={declined.map((m) => ({ name: m.name, note: m.note }))}
                  />
                </div>
              )}
            </div>
            {detail.status !== "declined" && (
              <SiteVisitDateEditor assignmentId={assignmentId} value={detail.siteVisitDate} />
            )}
          </div>

          {detail.status !== "declined" && (
            <div className="mt-[32px] px-[54px]">
              <Stepper steps={ASSIGNMENT_STEPS.map((s, i) => ({ ...s, done: i <= at }))} />
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
