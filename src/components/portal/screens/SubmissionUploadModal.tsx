"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { ensureSubmission } from "@/lib/submission-actions";
import { Button, FieldLabel, Modal, SelectInput, TextInput } from "../kit";

/**
 * The upload half of the Add Document modals (07.6-Requirements-modal.png and
 * its Phases variant). B4 left the fields presentational with no submit path;
 * this is the client-side piece that was missing.
 *
 * Client's call 2026-09-19: both variants get the same three buttons —
 * Cancel, Save Draft, Upload — replacing the old single Upload/Save button
 * that differed only in label between the two call sites. Save Draft uploads
 * whatever files are currently chosen without requiring every required slot
 * to be filled (there's no separate draft state to persist — an uploaded
 * document row already *is* the saved state, same as today). Upload does the
 * same POST but stays disabled until every required slot has a file, so it
 * only ever fires when the "full" submission is actually complete.
 */
export type UploadSlot = {
  key: string;
  label: string;
  required?: boolean;
  phaseDocumentId?: string;
  requirementAreaId?: string;
};

type SlotState = { file: File | null; name: string; error: string | null };

function AssignmentFields() {
  return (
    <>
      <div>
        <FieldLabel>Campus</FieldLabel>
        <div className="mt-[10px]">
          <SelectInput label="Campus" value="Sta. Mesa, Manila" />
        </div>
      </div>
      <div>
        <FieldLabel>Department</FieldLabel>
        <div className="mt-[10px]">
          <SelectInput label="Department" value="College of Computer and Information Sciences" />
        </div>
      </div>
      <div>
        <FieldLabel>Program</FieldLabel>
        <div className="mt-[10px]">
          <SelectInput label="Program" value="Bachelor of Science in Information Technology" />
        </div>
      </div>
    </>
  );
}

function SlotField({
  slot,
  state,
  onChange,
}: {
  slot: UploadSlot;
  state: SlotState;
  onChange: (next: Partial<SlotState>) => void;
}) {
  const fileInputId = `upload-${slot.key}`;

  return (
    <div>
      <span className="flex items-center gap-[4px]">
        <FieldLabel>{slot.label}</FieldLabel>
        {slot.required && <span className="text-regular font-semibold text-maroon">*</span>}
      </span>
      <div className="mt-[10px]">
        <TextInput
          label={slot.label}
          placeholder="Document Name"
          value={state.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ name: e.target.value })}
        />
      </div>
      <div className="mt-[12px] flex items-center gap-[12px]">
        <label
          htmlFor={fileInputId}
          className="flex h-[32px] shrink-0 cursor-pointer items-center rounded-full border border-maroon px-[16px] text-regular font-semibold leading-none text-maroon transition-opacity hover:opacity-80"
        >
          Choose file
        </label>
        <input
          id={fileInputId}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            onChange({
              file,
              name: state.name || file?.name.replace(/\.pdf$/i, "") || "",
              error: null,
            });
          }}
        />
        <span className="truncate text-regular leading-none text-gray">
          {state.file?.name ?? "No file chosen"}
        </span>
      </div>
      <p className="mt-[10px] flex items-start gap-[6px] text-micro leading-[14px] text-gray">
        <Info className="mt-[1px] h-[10px] w-[10px] shrink-0" strokeWidth={2} aria-hidden />
        <span>
          Maximum upload size of 25 MB.
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
  scrollBox?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, SlotState>>(() =>
    Object.fromEntries(slots.map((s) => [s.key, { file: null, name: "", error: null }])),
  );

  function patch(key: string, next: Partial<SlotState>) {
    setFields((prev) => ({ ...prev, [key]: { ...prev[key], ...next } }));
  }

  const allRequiredFilled = slots.every((s) => !s.required || Boolean(fields[s.key]?.file));

  function submit(draft: boolean) {
    setFormError(null);

    const toUpload = slots.filter((s) => fields[s.key]?.file);

    if (!draft) {
      const missingRequired = slots.find((s) => s.required && !fields[s.key]?.file);
      if (missingRequired) {
        patch(missingRequired.key, { error: "Choose a file." });
        return;
      }
    }
    if (toUpload.length === 0) {
      setFormError("Choose at least one file.");
      return;
    }

    startTransition(async () => {
      let subId = submissionId;
      if (!subId) {
        const ensured = await ensureSubmission(programId, levelId);
        if (!ensured.ok) {
          setFormError(ensured.error);
          return;
        }
        subId = ensured.submissionId;
      }

      for (const slot of toUpload) {
        const state = fields[slot.key];
        const form = new FormData();
        form.set("file", state.file as File);
        form.set("submissionId", subId);
        form.set("title", state.name || (state.file as File).name);
        if (slot.phaseDocumentId) form.set("phaseDocumentId", slot.phaseDocumentId);
        if (slot.requirementAreaId) form.set("requirementAreaId", slot.requirementAreaId);

        const res = await fetch("/api/submissions/upload", { method: "POST", body: form });
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: "Upload failed." }));
          patch(slot.key, { error: body.error ?? "Upload failed." });
          return;
        }
      }

      router.push(closeHref);
      router.refresh();
    });
  }

  const body = (
    <div className="flex flex-col gap-[18px]">
      <AssignmentFields />
      {slots.map((slot) => (
        <SlotField
          key={slot.key}
          slot={slot}
          state={fields[slot.key]}
          onChange={(next) => patch(slot.key, next)}
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

      {formError && <p className="mt-[12px] text-regular text-maroon">{formError}</p>}

      <div className="mt-[24px] flex justify-end gap-[12px]">
        <Button variant="ghost" href={closeHref}>
          Cancel
        </Button>
        <Button variant="secondary" disabled={pending} onClick={() => submit(true)}>
          Save Draft
        </Button>
        <Button
          variant="primary"
          disabled={pending || !allRequiredFilled}
          onClick={() => submit(false)}
        >
          {pending ? "Uploading…" : "Upload"}
        </Button>
      </div>
    </Modal>
  );
}
