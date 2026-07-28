import {
  PR_ACCREDITATION_LEVELS,
  PR_LEVEL_STEPS,
  PR_PHASES,
  PR_READINESS,
  PR_REQUIREMENTS,
} from "../data";
import {
  BackLink,
  Breadcrumb,
  Button,
  Panel,
  ProgressRow,
  RowList,
  SplitStat,
  Stepper,
} from "../kit";

/**
 * Program Representative → Submission. Five frames, one screen, one URL:
 *
 * | Frame | URL |
 * |---|---|
 * | `07-Submissions.png`            | `/portal/submission` |
 * | `08-Submissions(LevelsAcred.png`| `?level=1` |
 * | `08-Submissions(Levels).png`    | `?panel=levels` |
 * | `07-Submissions(Phases).png`    | `?view=phases` |
 * | `07-Submissions(PhasesReqs).png`| `?view=requirements` |
 *
 * Content padding is 58 left / 55 right / 26 top, and the panels are 1077 wide —
 * measured, and different again from the dashboard's 61/53. Every panel here
 * shares the 41px padding and 24px title gap that `Panel` owns.
 *
 * `?panel=levels` reproduces `08-Submissions(Levels).png`, which is very likely
 * a stale export: same state as `?level=1` but with the Readiness card dropped
 * and the panel retitled, on a card 5px wider than every other frame in the set.
 * Built at its own URL and flagged rather than guessed away.
 *
 * A known, deliberate divergence: `08-Submissions(LevelsAcred` draws the levels
 * box's bottom border above Levels III and IV, because the expanded stepper
 * overflowed a fixed-height Figma frame. The box here grows to contain them,
 * which is what `08-Submissions(Levels).png` does.
 */
export type SubmissionView = "levels" | "phases" | "requirements";

function ReadinessPanel() {
  return (
    <Panel title="Readiness Scores">
      <div className="flex gap-[25px]">
        {PR_READINESS.map((r) => (
          <div key={r.level} className="flex flex-1 flex-col">
            <span className="text-center text-regular font-semibold leading-none text-gray">
              {r.level}
            </span>
            <div className="mt-[14px] flex">
              <SplitStat
                left={{ value: `${r.percent}%`, caption: r.status, tone: "maroon" }}
                right={{
                  value: `${r.missing}`,
                  caption: "Missing\nDocuments",
                  tone: "yellow",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function LevelsPanel({ title, expanded }: { title: string; expanded: number | null }) {
  return (
    <Panel title={title}>
      <RowList>
        {PR_ACCREDITATION_LEVELS.map((level, i) => {
          const open = expanded === i + 1;
          return (
            <div key={level.label}>
              <ProgressRow
                label={level.label}
                percent={level.percent}
                href={
                  open
                    ? "/portal/submission?view=phases"
                    : `/portal/submission?level=${i + 1}`
                }
              />
              {open && (
                <div className="pl-[43px] pr-[58px]">
                  <Stepper steps={PR_LEVEL_STEPS} variant="levels" />
                </div>
              )}
            </div>
          );
        })}
      </RowList>
    </Panel>
  );
}

export default function ProgramRepSubmissions({
  view = "levels",
  level,
  panel,
}: {
  view?: SubmissionView;
  /** 1-based level to expand onto its stepper. */
  level?: number;
  /** `levels` drops the Readiness card and retitles the panel. */
  panel?: "levels";
}) {
  const bare = panel === "levels";

  const trail: { label: string }[] =
    view === "phases"
      ? [{ label: "Levels" }, { label: "Phases" }]
      : view === "requirements"
        ? [{ label: "Levels" }, { label: "Phases" }, { label: "Requirements" }]
        : [{ label: "Levels" }];

  return (
    <div className="pb-[61px] pl-[58px] pr-[55px] pt-[26px]">
      {!bare && <ReadinessPanel />}

      <div className={`pl-[17px] ${bare ? "" : "mt-[30px]"}`}>
        <Breadcrumb items={trail} variant="trail" />
      </div>

      <div className="mt-[9px]">
        {view === "levels" && (
          <LevelsPanel
            title={bare ? "Levels" : "Accreditation Levels"}
            expanded={bare ? 1 : (level ?? null)}
          />
        )}

        {view === "phases" && (
          <Panel
            title="Pre-Accreditation Phases"
            action={<BackLink href="/portal/submission" to="Levels" />}
            footer={
              <Button variant="muted" size="lg">
                Next
              </Button>
            }
          >
            <RowList>
              {PR_PHASES.map((phase) => (
                <ProgressRow
                  key={phase.label}
                  label={phase.label}
                  percent={phase.percent}
                  href="/portal/submission?view=requirements"
                />
              ))}
            </RowList>
          </Panel>
        )}

        {view === "requirements" && (
          <Panel
            title="Accreditation Requirements"
            action={<BackLink href="/portal/submission?view=phases" to="Phases" />}
            footer={
              <Button variant="muted" size="lg">
                Submit
              </Button>
            }
          >
            <RowList>
              {PR_REQUIREMENTS.map((label) => (
                <ProgressRow key={label} label={label} marker={false} />
              ))}
            </RowList>
          </Panel>
        )}
      </div>
    </div>
  );
}
