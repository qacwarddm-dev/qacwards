"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Info, XCircle } from "lucide-react";
import { ensureSubmission } from "@/lib/submission-actions";
import {
  Button,
  FieldLabel,
  Modal,
  ReadOnlyValue,
  SelectInput,
  Spinner,
  StatusPill,
  SuccessCheck,
  formatFileSize,
  useToast,
} from "../kit";

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
  fileSize: number | null;
  status: "idle" | "uploading" | "checking" | "saved" | "error";
  progress: number;
  error: string | null;
};

const EMPTY_SLOT: SlotState = {
  fileName: null,
  fileSize: null,
  status: "idle",
  progress: 0,
  error: null,
};

type UploadResult = { ok: true } | { ok: false; error: string };

/** XHR rather than fetch: fetch has no upload progress events. */
function postWithProgress(
  form: FormData,
  onProgress: (percent: number) => void,
  onSent: () => void,
): Promise<UploadResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/submissions/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.upload.onload = onSent;
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve({ ok: true });
      let error = "Upload failed.";
      try {
        error = JSON.parse(xhr.responseText).error ?? error;
      } catch {}
      resolve({ ok: false, error });
    };
    xhr.onerror = () => resolve({ ok: false, error: "The connection dropped. Try again." });
    xhr.send(form);
  });
}

function formatNow() {
  return new Date().toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
}

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
        {!state.fileName && (
          <span className="min-w-0 truncate text-regular leading-none text-gray">No file chosen</span>
        )}
      </div>
      {state.fileName && <FileProgress state={state} />}
      <p className="mt-[10px] flex items-start gap-[6px] text-micro leading-[14px] text-gray">
        <Info className="mt-[1px] h-[10px] w-[10px] shrink-0" strokeWidth={2} aria-hidden />
        <span>
          Maximum upload size of 25 MB. Files save automatically once chosen.
          <br />
          <span className="italic">Accepted formats: PDF only</span>
        </span>
      </p>
      {state.error && (
        <p
          role="alert"
          className="mt-[10px] rounded-[6px] border-l-[3px] border-maroon bg-[color:var(--tint-maroon)] px-[10px] py-[8px] text-regular leading-snug text-maroon"
        >
          {state.error}
        </p>
      )}
    </div>
  );
}

function FileProgress({ state }: { state: SlotState }) {
  const size = state.fileSize !== null ? formatFileSize(state.fileSize) : "";
  const inFlight = state.status === "uploading" || state.status === "checking";
  const line =
    state.status === "uploading"
      ? `${state.progress}% · ${size}`
      : state.status === "checking"
        ? "Checking the PDF…"
        : state.status === "saved"
          ? `Saved · ${size}`
          : "Not saved";

  return (
    <div className="mt-[12px] flex animate-[rise-in_var(--motion-slow)_var(--ease-out)] items-center gap-[12px] rounded-[12px] border border-[color:var(--hairline)] bg-white px-[14px] py-[12px]">
      <span
        aria-hidden
        className="flex h-[40px] w-[34px] shrink-0 items-center justify-center rounded-[6px] bg-[color:var(--tint-maroon)] text-small font-bold text-maroon"
      >
        PDF
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-regular font-semibold leading-snug text-black" title={state.fileName ?? ""}>
          {state.fileName}
        </p>
        <p
          className={`mt-[2px] text-small leading-none ${state.status === "error" ? "text-maroon" : "text-black/70"}`}
          aria-live="polite"
        >
          {line}
        </p>
        {inFlight && (
          <span className="mt-[8px] block h-[6px] overflow-hidden rounded-full bg-surface">
            <span
              className="block h-full rounded-full bg-maroon transition-[clip-path] duration-200 ease-out"
              style={{ clipPath: `inset(0 ${100 - state.progress}% 0 0 round 3px)` }}
            />
          </span>
        )}
      </div>
      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center">
        {state.status === "checking" && <Spinner size={16} label="Checking the PDF" />}
        {state.status === "saved" && (
          <CircleCheck
            className="h-[22px] w-[22px] animate-[success-pop_400ms_cubic-bezier(0.2,1.4,0.4,1)_both] text-[color:var(--color-approved)]"
            strokeWidth={2.25}
            aria-label="Saved"
          />
        )}
        {state.status === "error" && (
          <XCircle className="h-[22px] w-[22px] text-maroon" strokeWidth={2.25} aria-label="Not saved" />
        )}
      </span>
    </div>
  );
}

export default function SubmissionUploadModal({
  title,
  closeHref,
  viewHref,
  destination,
  uploaderName,
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
  viewHref: string;
  destination: string;
  uploaderName: string;
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
  const toast = useToast();
  const [subId, setSubId] = useState(submissionId);
  const [fields, setFields] = useState<Record<string, SlotState>>(() =>
    Object.fromEntries(slots.map((s) => [s.key, EMPTY_SLOT])),
  );
  const [doneAt, setDoneAt] = useState<string | null>(null);

  const current = programs.find((p) => p.slug === currentProgram);
  const busy = Object.values(fields).some((f) => f.status === "uploading" || f.status === "checking");
  const allRequiredSaved = slots.every((s) => !s.required || fields[s.key]?.status === "saved");
  const savedSlots = slots.filter((s) => fields[s.key]?.status === "saved");

  function patch(key: string, next: Partial<SlotState>) {
    setFields((prev) => ({ ...prev, [key]: { ...prev[key], ...next } }));
  }

  async function save(slot: UploadSlot, file: File) {
    patch(slot.key, {
      fileName: file.name,
      fileSize: file.size,
      status: "uploading",
      progress: 0,
      error: null,
    });

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

    const res = await postWithProgress(
      form,
      (progress) => patch(slot.key, { progress }),
      () => patch(slot.key, { status: "checking", progress: 100 }),
    );
    if (!res.ok) {
      patch(slot.key, { status: "error", error: res.error });
      return;
    }
    patch(slot.key, { status: "saved", progress: 100 });
  }

  function finish() {
    if (!allRequiredSaved) {
      const missing = slots.find((s) => s.required && fields[s.key]?.status !== "saved");
      if (missing) patch(missing.key, { error: "Choose a file." });
      return;
    }
    if (savedSlots.length === 0) {
      router.push(closeHref);
      return;
    }
    setDoneAt(formatNow());
  }

  function leave(href: string, announce: boolean) {
    if (announce) {
      const n = savedSlots.length;
      toast.push({
        tone: "success",
        title: "Upload successful",
        description: `${n} document${n === 1 ? "" : "s"} saved to ${destination}.`,
      });
    }
    router.push(href, { scroll: false });
    router.refresh();
  }

  if (doneAt) {
    return (
      <Modal bare title="Uploaded successfully" onClose={() => leave(closeHref, true)} className="w-[460px] max-w-full">
        <div className="overflow-y-auto px-[24px] pb-[4px] pt-[32px] text-center sm:px-[28px]">
          <SuccessCheck />
          <p className="mt-[18px] text-heading font-bold leading-tight text-black">Uploaded Successfully!</p>
          <p className="mx-auto mt-[8px] max-w-[40ch] text-regular leading-relaxed text-black/70">
            Your documents were saved to{" "}
            <span className="font-semibold text-black">{destination}</span>. They are now waiting for
            review by the QA Center.
          </p>

          <dl className="mt-[20px] overflow-hidden rounded-[12px] border border-[color:var(--hairline)] text-left text-regular">
            <div className="flex justify-between gap-[12px] border-b border-[color:var(--hairline)] px-[14px] py-[10px]">
              <dt className="text-black/70">Files</dt>
              <dd className="flex min-w-0 flex-col items-end gap-[6px]">
                {savedSlots.map((slot, i) => (
                  <span
                    key={slot.key}
                    className="flex animate-[rise-in_var(--motion-slow)_var(--ease-out)_both] items-center gap-[6px] font-semibold text-black"
                    style={{ animationDelay: `${450 + i * 90}ms` }}
                  >
                    <CircleCheck
                      className="h-[14px] w-[14px] shrink-0 text-[color:var(--color-approved)]"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    <span className="truncate">{slot.label}</span>
                  </span>
                ))}
              </dd>
            </div>
            <div className="flex justify-between gap-[12px] border-b border-[color:var(--hairline)] px-[14px] py-[10px]">
              <dt className="text-black/70">Uploaded by</dt>
              <dd className="text-right font-semibold text-black">{uploaderName}</dd>
            </div>
            <div className="flex justify-between gap-[12px] border-b border-[color:var(--hairline)] px-[14px] py-[10px]">
              <dt className="text-black/70">Date &amp; time</dt>
              <dd className="text-right font-semibold text-black">{doneAt}</dd>
            </div>
            <div className="flex items-center justify-between gap-[12px] px-[14px] py-[10px]">
              <dt className="text-black/70">Status</dt>
              <dd>
                <StatusPill status="pending_review" />
              </dd>
            </div>
          </dl>
        </div>
        <div className="flex justify-center gap-[12px] px-[24px] pb-[28px] pt-[20px]">
          <Button variant="secondary" onClick={() => leave(viewHref, false)}>
            View Submission
          </Button>
          <Button variant="primary" onClick={() => leave(closeHref, true)}>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  const body = (
    <div className="flex flex-col gap-[18px]">
      {current && <AssignmentFields programs={programs} current={current} />}
      {slots.map((slot) => (
        <SlotField
          key={slot.key}
          slot={slot}
          state={fields[slot.key]}
          disabled={fields[slot.key]?.status === "uploading" || fields[slot.key]?.status === "checking"}
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
        <Button variant="primary" disabled={busy || !allRequiredSaved} onClick={finish}>
          {busy ? "Uploading…" : "Upload"}
        </Button>
      </div>
    </Modal>
  );
}
