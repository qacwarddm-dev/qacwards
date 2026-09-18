import { PR_PHASE_STEPS } from "../data";
import {
  Alert,
  Breadcrumb,
  Button,
  Panel,
  ProgressRow,
  RadialProgress,
  RowList,
  Stepper,
  type StatusKey,
} from "../kit";
import SubmissionUploadModal, { type UploadSlot } from "./SubmissionUploadModal";

/**
 * Program Representative → Submission. One screen, query-param states:
 *
 * | Frame | URL |
 * |---|---|
 * | `07-Submission-Main.png`                          | `/portal/submission` |
 * | `07.1-Submissions-Levels.png`                     | `?program=<slug>` |
 * | `07.2Submission-LevelsDropdown.png`                | same as above — visually identical export, not modelled separately |
 * | `07.3Submission-Levels-Phases.png`                | `?program=<slug>&view=phases` |
 * | `07.4-Submissions-Levels-Phases-DropDown.png`     | `?program=<slug>&view=phases&phase=1` |
 * | `07.5-Submissions-Levels-Phases-Requirements.png` | `?program=<slug>&view=requirements` |
 * | `07.6-Requirements-modal.png`                     | `?program=<slug>&view=requirements&modal=add`, or `&view=phases&phase=<n>&modal=add` |
 *
 * The frame set adds a Programs picker ahead of the old Levels root — every
 * later state is scoped to a `program` slug from `data.programs`, so a page
 * with no `program` always renders that picker regardless of the other params.
 *
 * The Levels list no longer expands a stepper inline (compare the old asset
 * set's `08-Submissions(LevelsAcred.png`, now deleted) — the drill-down moved
 * one level in, onto the Phases row, which is what `phase` toggles.
 *
 * On the Phases row, the commit marker and the rest of the row are two
 * separate targets (`ProgressRow`'s `markerHref` vs `href`): the marker
 * toggles `phase` in place; the rest of the row — label, bar, chevron — opens
 * `PhaseDocumentModal`, that phase's own Add Document dialog (distinct from
 * `AddDocumentModal` on Requirements — see both for why). Advancing the
 * breadcrumb stage is the Panel's own "Next" / "Back to …" affordances, plus
 * the trail itself: `Breadcrumb`'s non-final crumbs (Levels, Phases) are
 * links back to those views.
 */
export type SubmissionView = "levels" | "phases" | "requirements";

/**
 * Real data, passed in.
 *
 * The screen was built against `PR_*` constants in `data.ts`; B4 replaced those
 * with these props and changed nothing about the layout. That was the point of
 * keeping the screen presentational — the swap is a page-level change, and every
 * measured piece of geometry here is untouched by it.
 */
export type SubmissionProgram = { slug: string; label: string };

export type SubmissionLevel = {
  levelId: string;
  label: string;
  code: string;
  percent: number;
  requiredCount: number;
  uploadedCount: number;
  submissionId: string | null;
};

export type SubmissionPhase = {
  ordinal: number;
  label: string;
  percent: number;
  documents: { id: string; name: string; isOptional: boolean; uploaded: boolean }[];
};

export type SubmissionArea = {
  id: string;
  name: string;
  isOptional: boolean;
  chosen: boolean;
  uploaded: boolean;
};

export type SubmissionData = {
  programs: SubmissionProgram[];
  levels: SubmissionLevel[];
  phases: SubmissionPhase[];
  areas: SubmissionArea[];
  /** Null when QAC has not opened a cycle — nothing can be filed into. */
  openCycleName: string | null;
};

function ProgramsPanel({ programs }: { programs: SubmissionProgram[] }) {
  if (programs.length === 0) {
    return (
      <Panel title="Programs">
        <p className="px-[43px] py-[24px] text-subheading text-gray">
          You do not represent any programmes yet. The Quality Assurance Center
          assigns them.
        </p>
      </Panel>
    );
  }

  return (
    <Panel title="Programs">
      <RowList>
        {programs.map((p) => (
          <ProgressRow
            key={p.slug}
            label={p.label}
            marker={false}
            href={`/portal/submission?program=${p.slug}`}
          />
        ))}
      </RowList>
    </Panel>
  );
}

/** Mirrors Extension Monitoring's own three-state ring (not_started / phase_in_progress
 *  / a "done" success state) rather than OtherContext.txt's five-band split — the
 *  refreshed frame only ever draws Not Started, In Progress, or Ready for Evaluation. */
function readinessStatus(percent: number): StatusKey {
  if (percent === 0) return "not_started";
  if (percent === 100) return "ready_for_evaluation";
  return "phase_in_progress";
}

function ReadinessPanel({ levels }: { levels: SubmissionLevel[] }) {
  return (
    <Panel title="Readiness Scores">
      <div className="flex flex-wrap gap-[16px] sm:flex-nowrap">
        {levels.map((r) => {
          const missing = Math.max(0, r.requiredCount - r.uploadedCount);
          return (
            <RadialProgress
              key={r.levelId}
              label={r.code === "PSV" ? "PSV" : `LEVEL ${r.code}`}
              percent={r.percent}
              status={readinessStatus(r.percent)}
              caption={
                missing === 0
                  ? "0 missing documents"
                  : `${missing} missing document${missing === 1 ? "" : "s"}`
              }
            />
          );
        })}
      </div>
    </Panel>
  );
}

function LevelsPanel({
  program,
  levels,
}: {
  program: string;
  levels: SubmissionLevel[];
}) {
  // Client backlog (2026-09-06 notes): the "QAC Service Evaluation" survey
  // triggers once a level's documents are reviewed and approved, which this
  // screen already tracks as `percent` reaching 100 — the same field the
  // level row's own bar reads, not a second readiness check.
  const doneLevel = levels.find((l) => l.percent === 100);

  return (
    <Panel
      title="Accreditation Levels"
      footer={
        doneLevel && (
          <Button
            variant="secondary"
            href={`/portal/submission/evaluation?program=${program}&level=${doneLevel.levelId}`}
          >
            Rate QAC&apos;s Service
          </Button>
        )
      }
    >
      <RowList>
        {levels.map((level) => (
          <ProgressRow
            key={level.levelId}
            label={level.label}
            percent={level.percent}
            href={`/portal/submission?program=${program}&view=phases&level=${level.levelId}`}
          />
        ))}
      </RowList>
    </Panel>
  );
}

function PhasesPanel({
  program,
  phase,
  phases,
  levelId,
}: {
  program: string;
  phase: number | null;
  phases: SubmissionPhase[];
  levelId: string | null;
}) {
  // Client call: "Next" stays clickable regardless, but only takes its full
  // maroon once every phase reads 100%. Muted is the button's own
  // resting/incomplete look everywhere else in the kit, so this is a state
  // switch, not a new variant.
  const allPhasesComplete = phases.length > 0 && phases.every((p) => p.percent === 100);
  const levelParam = levelId ? `&level=${levelId}` : "";

  return (
    <Panel
      title="Pre-Accreditation Phases"
      back={{ href: `/portal/submission?program=${program}`, to: "Levels" }}
      footer={
        <Button
          variant={allPhasesComplete ? "solid" : "muted"}
          size="lg"
          href={`/portal/submission?program=${program}&view=requirements${levelParam}`}
        >
          Next
        </Button>
      }
    >
      <RowList>
        {phases.map((p) => {
          const n = p.ordinal;
          const open = phase === n;
          const base = `/portal/submission?program=${program}&view=phases${levelParam}`;
          return (
            <div key={p.label}>
              <ProgressRow
                label={p.label}
                percent={p.percent}
                href={`${base}&phase=${n}&modal=add`}
                markerHref={open ? base : `${base}&phase=${n}`}
              />
              {open && (
                <div className="pl-[43px] pr-[58px]">
                  <Stepper steps={PR_PHASE_STEPS} variant="levels" />
                </div>
              )}
            </div>
          );
        })}
      </RowList>
    </Panel>
  );
}

function RequirementsPanel({
  program,
  areas,
  levelId,
}: {
  program: string;
  areas: SubmissionArea[];
  levelId: string | null;
}) {
  const half = Math.ceil(areas.length / 2);
  const left = areas.slice(0, half);
  const right = areas.slice(half);
  const levelParam = levelId ? `&level=${levelId}` : "";
  const addHref = (areaId: string) =>
    `/portal/submission?program=${program}&view=requirements${levelParam}&modal=add&area=${areaId}`;

  return (
    <Panel
      title="Accreditation Requirements"
      back={{
        href: `/portal/submission?program=${program}&view=phases${levelParam}`,
        to: "Phases",
      }}
      footer={
        <Button variant="muted" size="lg">
          Submit
        </Button>
      }
    >
      <div className="flex gap-[24px]">
        {[left, right].map((col, i) => (
          <div key={i} className="flex-1">
            <RowList>
              {col.map((area) => (
                <ProgressRow
                  key={area.id}
                  label={area.isOptional && !area.chosen ? `${area.name} (optional)` : area.name}
                  marker={false}
                  percent={area.uploaded ? 100 : undefined}
                  href={addHref(area.id)}
                />
              ))}
            </RowList>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export default function ProgramRepSubmissions({
  program,
  programId,
  view = "levels",
  phase,
  modal,
  levelId,
  areaId,
  data,
}: {
  program?: string;
  /** UUID behind `program`'s slug — needed to create a submission on first
   *  upload (D-14: lazy creation, not pre-seeded). */
  programId?: string;
  view?: SubmissionView;
  /** 1-based phase to expand its inline stepper. */
  phase?: number;
  modal?: "add";
  levelId?: string;
  /** Which requirement area's row opened the modal — carried in the URL
   *  since the Requirements grid has no other per-row state. */
  areaId?: string;
  data: SubmissionData;
}) {
  if (!program) {
    return (
      <div className="px-[var(--page-gutter)] pb-[61px] pt-[26px] lg:pl-[58px] lg:pr-[55px]">
        <ProgramsPanel programs={data.programs} />
      </div>
    );
  }

  const currentLevel = data.levels.find((l) => l.levelId === levelId);
  const levelParam = levelId ? `&level=${levelId}` : "";
  const levelsHref = `/portal/submission?program=${program}`;
  const phasesHref = `/portal/submission?program=${program}&view=phases${levelParam}`;

  const trail =
    view === "phases"
      ? [{ label: "Levels", href: levelsHref }, { label: "Phases" }]
      : view === "requirements"
        ? [
            { label: "Levels", href: levelsHref },
            { label: "Phases", href: phasesHref },
            { label: "Requirements" },
          ]
        : [{ label: "Levels" }];

  return (
    <div className="px-[var(--page-gutter)] pb-[61px] pt-[26px] lg:pl-[58px] lg:pr-[55px]">
      {data.openCycleName === null && (
        <div className="mb-[18px]">
          <Alert tone="warning" title="No accreditation cycle is open.">
            Documents cannot be uploaded until the Quality Assurance Center opens
            one. Everything below is read-only until then.
          </Alert>
        </div>
      )}

      <ReadinessPanel levels={data.levels} />

      <div className="mt-[30px] pl-[17px]">
        <Breadcrumb items={trail} variant="trail" />
      </div>

      <div className="mt-[9px]">
        {view === "levels" && <LevelsPanel program={program} levels={data.levels} />}
        {view === "phases" && (
          <PhasesPanel
            program={program}
            phase={phase ?? null}
            phases={data.phases}
            levelId={levelId ?? null}
          />
        )}
        {view === "requirements" && (
          <RequirementsPanel
            program={program}
            areas={data.areas}
            levelId={levelId ?? null}
          />
        )}
      </div>

      {modal === "add" && view === "phases" && programId && levelId && (
        <SubmissionUploadModal
          title="Add Document"
          submitLabel="Save"
          scrollBox
          programId={programId}
          levelId={levelId}
          submissionId={currentLevel?.submissionId ?? null}
          slots={(data.phases.find((p) => p.ordinal === (phase ?? 1))?.documents ?? []).map(
            (d): UploadSlot => ({
              key: d.id,
              label: d.name,
              required: true,
              phaseDocumentId: d.id,
            }),
          )}
          closeHref={`/portal/submission?program=${program}&view=phases${levelParam}${phase ? `&phase=${phase}` : ""}`}
        />
      )}
      {modal === "add" && view === "requirements" && areaId && programId && levelId && (
        <SubmissionUploadModal
          title="Add Document"
          submitLabel="Upload"
          programId={programId}
          levelId={levelId}
          submissionId={currentLevel?.submissionId ?? null}
          slots={[
            { key: "document", label: "Document", required: true, requirementAreaId: areaId },
            {
              key: "additional",
              label: "Additional Document (Optional)",
              requirementAreaId: areaId,
            },
          ]}
          closeHref={`/portal/submission?program=${program}&view=requirements${levelParam}`}
        />
      )}
    </div>
  );
}
