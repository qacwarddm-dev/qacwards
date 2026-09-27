"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Info } from "lucide-react";
import { ensureSubmission } from "@/lib/submission-actions";
import { Button, FieldLabel, Modal, ReadOnlyValue, SelectInput, Spinner } from "../kit";

/**
 * The upload half of the Add Document modals (07.6-Requirements-modal.png and
 * its Phases variant).
 *
 * Client revision 2026-09-27: no Save Draft — a file saves the moment it is
 * chosen, so Upload only closes the dialog once every required slot is saved.
 * The document name is fixed by the slot, not typed, so file names stay
 * uniform across programmes.
 */
export type UploadSlot = {
  key: string;
  label: string;
  documentName: string;
  required?: boolean;
  phaseDocumentId?: string;
  requirementAreaId?: string;
};

export type ProgramChoice = {
  slug: string;
  label: string;
  college: string | null;
  campus: string | null;
  /** Where this same dialog lives for that programme. */
  href: string;
};

type SlotState = {
  fileName: string | null;
  status: "idle" | "saving" | "saved" | "error";
  error: string | null;
};

const NO_COLLEGE = "—";

function uniq(values: string[]) {
  return [...new Set(values)];
}

function AssignmentFields({
  programs,
  current,
}: {
  programs: ProgramChoice[];
  current: ProgramChoice;
}) {
  const router = useRouter();
  const [campus, setCampus] = useState(current.campus ?? NO_COLLEGE);
  const [college, setCollege] = useState(current.college ?? NO_COLLEGE);

  const inCampus = programs.filter((p) => (p.campus ?? NO_COLLEGE) === campus);
  const inCollege = inCampus.filter((p) => (p.college ?? NO_COLLEGE) === college);

  function go(p: ProgramChoice | undefined) {
    if (p && p.slug !== current.slug) router.push(p.href, { scroll: false });
  }

  return (
    <>
      <div>
        <FieldLabel>Campus</FieldLabel>
        <div className="mt-[10px]">
          <SelectInput
            label="Campus"
            options={uniq(programs.map((p) => p.campus ?? NO_COLLEGE))}
            defaultValue={campus}
            onSelect={(v) => {
              setCampus(v);
              const first = programs.find((p) => (p.campus ?? NO_COLLEGE) === v);
              setCollege(first?.college ?? NO_COLLEGE);
              go(first);
            }}
          />
        </div>
      </div>
      <div>
        <FieldLabel>Department</FieldLabel>
        <div className="mt-[10px]">
          <SelectInput
            label="Department"
            options={uniq(inCampus.map((p) => p.college ?? NO_COLLEGE))}
            defaultValue={college}
            onSelect={(v) => {
              setCollege(v);
              go(inCampus.find((p) => (p.college ?? NO_COLLEGE) === v));
            }}
          />
        </div>
      </div>
      <div>
        <FieldLabel>Program</FieldLabel>
        <div className="mt-[10px]">
          <SelectInput
            label="Program"
            options={inCollege.map((p) => p.label)}
            defaultValue={inCollege.some((p) => p.slug === current.slug) ? current.label : undefined}
            onSelect={(v) => go(inCollege.find((p) => p.label === v))}
          />
        </div>
      </div>
    </>
  );
}

function SlotField({
  slot,
  state,
  disabled,
  onFile,
}: {
  slot: UploadSlot;
  state: SlotState;
  disabled: boolean;
  onFile: (file: File) => void;
}) {
  const fileInputId = `upload-${slot.key}`;

  return (
    <div>
      <span className="flex items-center gap-[4px]">
        <FieldLabel>{slot.label}</FieldLabel>
        {slot.required && <span className="text-regular font-semibold text-maroon">*</span>}
      </span>
      <div className="mt-[10px]">
        <ReadOnlyValue label={`${slot.label} document name`} value={slot.documentName} />
      </div>
      <div className="mt-[12px] flex items-center gap-[12px]">
        <label
          htmlFor={fileInputId}
          className={`flex h-[32px] shrink-0 items-center rounded-full border border-maroon px-[16px] text-regular font-semibold leading-none text-maroon transition-opacity hover:opacity-80 ${
            disabled ? "pointer-events-none opacity-50" : "cursor-pointer"
          }`}
        >
          Choose file
        </label>
        <input
          id={fileInputId}
          type="file"
          accept="application/pdf"
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
        <span className="min-w-0 truncate text-regular leading-none text-gray">
          {state.fileName ?? "No file chosen"}
        </span>
        {state.status === "saving" && <Spinner size={16} label="Saving" />}
        {state.status === "saved" && (
          <span className="flex shrink-0 items-center gap-[4px] text-micro leading-none text-positive">
            <CircleCheck className="h-[13px] w-[13px]" strokeWidth={2.5} aria-hidden />
            Saved
          </span>
        )}
      </div>
      <p className="mt-[10px] flex items-start gap-[6px] text-micro leading-[14px] text-gray">
        <Info className="mt-[1px] h-[10px] w-[10px] shrink-0" strokeWidth={2} aria-hidden />
        <span>
          Maximum upload size of 25 MB. Files save automatically once chosen.
          <br />
          <span className="italic">Accepted formats: PDF only</span>
        </span>
      </p>
      {state.error && <p className="mt-[6px] text-micro text-maroon">{state.error}</p>}
    </div>
  );
}

export default function SubmissionUploadModal({
  title,
  closeHref,
  slots,
  submissionId,
  programId,
  levelId,
  programs,
  currentProgram,
  scrollBox,
}: {
  title: string;
  closeHref: string;
  slots: UploadSlot[];
  /** Null when this level has no submission row yet — created on first upload
   *  (D-14: submissions are created lazily, not pre-seeded). */
  submissionId: string | null;
  programId: string;
  levelId: string;
  programs: ProgramChoice[];
  currentProgram: string;
  scrollBox?: boolean;
}) {
  const router = useRouter();
  const [subId, setSubId] = useState(submissionId);
  const [fields, setFields] = useState<Record<string, SlotState>>(() =>
    Object.fromEntries(
      slots.map((s) => [s.key, { fileName: null, status: "idle", error: null } as SlotState]),
    ),
  );

  const current = programs.find((p) => p.slug === currentProgram);
  const saving = Object.values(fields).some((f) => f.status === "saving");
  const allRequiredSaved = slots.every((s) => !s.required || fields[s.key]?.status === "saved");

  function patch(key: string, next: Partial<SlotState>) {
    setFields((prev) => ({ ...prev, [key]: { ...prev[key], ...next } }));
  }

  async function save(slot: UploadSlot, file: File) {
    patch(slot.key, { fileName: file.name, status: "saving", error: null });

    let id = subId;
    if (!id) {
      const ensured = await ensureSubmission(programId, levelId);
      if (!ensured.ok) {
        patch(slot.key, { status: "error", error: ensured.error });
        return;
      }
      id = ensured.submissionId;
      setSubId(id);
    }

    const form = new FormData();
    form.set("file", file);
    form.set("submissionId", id);
    form.set("title", slot.documentName);
    if (slot.phaseDocumentId) form.set("phaseDocumentId", slot.phaseDocumentId);
    if (slot.requirementAreaId) form.set("requirementAreaId", slot.requirementAreaId);

    const res = await fetch("/api/submissions/upload", { method: "POST", body: form });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Upload failed." }));
      patch(slot.key, { status: "error", error: body.error ?? "Upload failed." });
      return;
    }
    patch(slot.key, { status: "saved" });
  }

  function finish() {
    if (!allRequiredSaved) {
      const missing = slots.find((s) => s.required && fields[s.key]?.status !== "saved");
      if (missing) patch(missing.key, { error: "Choose a file." });
      return;
    }
    router.push(closeHref);
    router.refresh();
  }

  const body = (
    <div className="flex flex-col gap-[18px]">
      {current && <AssignmentFields programs={programs} current={current} />}
      {slots.map((slot) => (
        <SlotField
          key={slot.key}
          slot={slot}
          state={fields[slot.key]}
          disabled={fields[slot.key]?.status === "saving"}
          onFile={(file) => save(slot, file)}
        />
      ))}
    </div>
  );

  return (
    <Modal title={title} closeHref={closeHref} className="w-[460px]">
      {scrollBox ? (
        <div className="max-h-[380px] overflow-y-auto rounded-[12px] border border-[color:var(--color-gray)]/20 p-[16px]">
          {body}
        </div>
      ) : (
        body
      )}

      <div className="mt-[24px] flex justify-end gap-[12px]">
        <Button variant="ghost" href={closeHref}>
          Cancel
        </Button>
        <Button variant="primary" disabled={saving || !allRequiredSaved} onClick={finish}>
          {saving ? "Saving…" : "Upload"}
        </Button>
      </div>
    </Modal>
  );
}
