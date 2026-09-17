"use client";

import { useState } from "react";
import type { ExtensionPhase, ExtensionProgramDetail } from "@/lib/extension-monitoring";
import {
  BackLink,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  PanelHeader,
  ProgressRow,
  RadialProgress,
  RowList,
  StatusPill,
  useToast,
} from "@/components/portal/kit";

/**
 * assets/new frames/QAC/Externsion Monitoring/1-5.png. The four numbered
 * frames chain into one state machine on a single screen:
 *   Pre-Accreditation Phases row -> "Notice of Meeting" document (2)
 *   -> Approve (3) or Reject (4) confirmation, or Return with a note (5).
 *
 * Frame 2 itself only draws Return/Approve, but the client also drew a
 * standalone Reject Confirmation dialog (4) with no other way to reach it —
 * a Reject action is added to the document footer alongside Return/Approve
 * so that dialog has a caller. Everything here is local state; see
 * `src/lib/extension-monitoring.ts` for why there is no persistence yet.
 */
export default function ExtensionMonitoringDetail({
  program: initialProgram,
}: {
  program: ExtensionProgramDetail;
}) {
  const [program, setProgram] = useState(initialProgram);
  const [openPhase, setOpenPhase] = useState<ExtensionPhase | null>(null);
  const [confirm, setConfirm] = useState<"approve" | "reject" | null>(null);
  const [returning, setReturning] = useState(false);
  const toast = useToast();

  function updatePhase(number: number, patch: Partial<ExtensionPhase>) {
    setProgram((p) => ({
      ...p,
      phases: p.phases.map((ph) => (ph.number === number ? { ...ph, ...patch } : ph)),
    }));
  }

  function closeAll() {
    setOpenPhase(null);
    setConfirm(null);
    setReturning(false);
  }

  function handleApprove() {
    if (!openPhase) return;
    updatePhase(openPhase.number, { status: "evaluated", percent: 100 });
    toast.push({ tone: "success", title: `${openPhase.title} approved.` });
    closeAll();
  }

  function handleReject() {
    if (!openPhase) return;
    updatePhase(openPhase.number, { status: "disapproved" });
    toast.push({ tone: "error", title: `${openPhase.title} rejected.` });
    closeAll();
  }

  function handleReturn(note?: string) {
    if (!openPhase) return;
    updatePhase(openPhase.number, { status: "returned" });
    toast.push({
      tone: "info",
      title: "Returned to the program rep.",
      description: note,
    });
    closeAll();
  }

  const firstPhaseCleared = program.phases[0]?.status === "evaluated";

  return (
    <div className="px-[var(--page-gutter)] pb-[45px] pt-[45px] lg:px-[57px]">
      <h1 className="sr-only">Extension Monitoring — {program.program}</h1>

      <Card className="px-[24px] py-[32px] sm:px-[44.5px] sm:pb-[42px] sm:pt-[47px]">
        <PanelHeader title="Extension Readiness" />
        <div className="mt-[20px] flex flex-wrap gap-[16px] sm:flex-nowrap">
          {program.phases.map((phase) => (
            <RadialProgress
              key={phase.number}
              label={`Phase ${phase.number}`}
              percent={phase.percent}
              status={phase.status}
              caption={
                phase.missingDocuments === 0
                  ? "0 missing documents"
                  : `${phase.missingDocuments} missing document${phase.missingDocuments === 1 ? "" : "s"}`
              }
            />
          ))}
        </div>
      </Card>

      <Card className="mt-[26px] px-[24px] py-[32px] sm:px-[44.5px] sm:pb-[42px] sm:pt-[47px]">
        <div className="flex items-center justify-between">
          <h2 className="text-heading font-semibold leading-none text-black">
            Pre-Accreditation Phases
          </h2>
          <BackLink href="/portal/extension-monitoring" to="Programs" />
        </div>

        <div className="mt-[20px]">
          <RowList>
            {program.phases.map((phase) => (
              <ProgressRow
                key={phase.number}
                label={phase.title}
                marker={false}
                meta={[
                  phase.lastModified ? `Last modified: ${phase.lastModified}` : "Last modified: —",
                ]}
                right={<StatusPill status={phase.status} size="sm" />}
                onClick={phase.document ? () => setOpenPhase(phase) : undefined}
              />
            ))}
          </RowList>
        </div>

        <div className="mt-[26px] flex justify-end">
          <Button
            variant="primary"
            disabled={!firstPhaseCleared}
            onClick={() => toast.push({ tone: "info", title: "Phase 2 unlocked." })}
          >
            Next
          </Button>
        </div>
      </Card>

      {/* --- Notice of Meeting document review (frame 2) --------------------- */}
      <Dialog
        open={openPhase !== null}
        onOpenChange={(open) => !open && setOpenPhase(null)}
        title={openPhase?.document?.title ?? "Document"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReturning(true)}>
              Return
            </Button>
            <Button variant="danger" onClick={() => setConfirm("reject")}>
              Reject
            </Button>
            <Button variant="primary" onClick={() => setConfirm("approve")}>
              Approve
            </Button>
          </>
        }
      >
        <NoticeOfMeetingPreview />
      </Dialog>

      {/* --- Approve / Reject confirmation (frames 3, 4) --------------------- */}
      <ConfirmDialog
        open={confirm === "approve"}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Approve Confirmation"
        description="Are you sure you want to approve this assignment?"
        confirmLabel="Approve"
        onConfirm={handleApprove}
      />
      <ConfirmDialog
        open={confirm === "reject"}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Reject Confirmation"
        description="Are you sure you want to reject this document?"
        confirmLabel="Reject"
        tone="danger"
        onConfirm={handleReject}
      />

      {/* --- Return note (frame 5) -------------------------------------------- */}
      <ConfirmDialog
        open={returning}
        onOpenChange={(v) => !v && setReturning(false)}
        title="Return Note"
        description="Tell the program representative what needs fixing."
        confirmLabel="Send"
        requireReason
        onConfirm={(reason) => handleReturn(reason)}
      />
    </div>
  );
}

/**
 * Stand-in for the actual uploaded scan — reproduces the sample notice's text
 * verbatim (RA 10173 boilerplate + the consent radios), since no real
 * document asset exists to preview yet.
 */
function NoticeOfMeetingPreview() {
  return (
    <div className="rounded-[10px] border border-[color:var(--color-gray)]/25 bg-white p-[32px]">
      <div className="mx-auto flex h-[36px] w-[36px] items-center justify-center rounded-full bg-maroon text-white">
        ★
      </div>
      <p className="mt-[12px] text-center text-small font-semibold uppercase tracking-wide text-black">
        Polytechnic University of the Philippines
      </p>
      <hr className="my-[16px] border-[color:var(--color-gray)]/30" />

      <p className="text-regular font-semibold text-black">Part I: Data Privacy Consent</p>
      <p className="mt-[10px] text-regular leading-relaxed text-black">
        Following the Data Privacy Act of 2012, Republic Act 10173, the researchers will
        handle all gathered information, including personal and contact information,
        confidentially and will use it solely for academic purposes.
      </p>
      <p className="mt-[10px] text-regular leading-relaxed text-black">
        By choosing <strong>&quot;I Agree&quot;</strong>, you acknowledge that your
        participation in the study is voluntary and willing.
      </p>

      <div className="mt-[14px] flex flex-col gap-[8px] pl-[8px] text-regular text-black">
        <label className="flex items-center gap-[8px]">
          <input type="radio" name="consent" defaultChecked readOnly /> I Agree
        </label>
        <label className="flex items-center gap-[8px]">
          <input type="radio" name="consent" readOnly /> I Disagree
        </label>
      </div>

      <p className="mt-[20px] text-regular font-semibold text-black">
        Part II: Demographic Profile of Respondents
      </p>
    </div>
  );
}
