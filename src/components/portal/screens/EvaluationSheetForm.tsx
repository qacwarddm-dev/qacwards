"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { finishEvaluationSheet } from "@/lib/assignment-actions";
import {
  HEADER_KEYS,
  SHEET_TEMPLATES,
  formatLongDate,
  missingKeys,
  type SheetTemplateKey,
} from "@/lib/evaluation-sheet";
import {
  Button,
  ConfirmModal,
  Panel,
  ReadOnlyField,
  SignatureBlock,
  TextField,
  TextareaField,
  useToast,
} from "../kit";
import { useSheetAutosave } from "./useSheetAutosave";

const STATUS_TEXT = {
  idle: "All changes saved",
  saving: "Saving…",
  saved: "All changes saved",
  error: "Not saved",
} as const;

export default function EvaluationSheetForm({
  assignmentId,
  templateKey,
  program,
  branch,
  levelLine,
  initialValues,
  seedDefaults,
  readOnly,
  evaluatedAt,
  signatories,
}: {
  assignmentId: string;
  templateKey: SheetTemplateKey;
  program: string;
  branch: string;
  levelLine: string;
  initialValues: Record<string, string>;
  seedDefaults: Record<string, string>;
  readOnly: boolean;
  evaluatedAt: string | null;
  signatories: { id: string; name: string; signatureUrl: string | null }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const template = SHEET_TEMPLATES[templateKey];
  const [confirming, setConfirming] = useState(false);
  const [submitting, startSubmit] = useTransition();
  const { values, setValue, flush, status, error, lastEditor } = useSheetAutosave(
    assignmentId,
    initialValues,
    { readOnly },
  );

  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    for (const [k, v] of Object.entries(seedDefaults)) setValue(k, v);
  }, [seedDefaults, setValue]);

  const missing = missingKeys(template, values);

  function submit() {
    startSubmit(async () => {
      await flush();
      const result = await finishEvaluationSheet(assignmentId);
      if (!result.ok) {
        toast.push({ tone: "error", title: result.error });
        setConfirming(false);
        return;
      }
      toast.push({ tone: "success", title: "Evaluation submitted. The PDF is ready." });
      router.push(`/portal/evaluation/${assignmentId}`);
      router.refresh();
    });
  }

  const field = (key: string) => ({
    value: values[key] ?? "",
    readOnly,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValue(key, e.target.value),
  });

  const signedDate = evaluatedAt ? formatLongDate(evaluatedAt) : undefined;

  return (
    <div className="pb-[50px] pl-[54px] pr-[52px] pt-[50px]">
      <Panel
        title="Evaluation Sheet"
        back={{ href: `/portal/evaluation/${assignmentId}`, to: "Requirements" }}
        action={
          readOnly ? (
            <Button variant="primary" href={`/api/evaluations/${assignmentId}/sheet`}>
              Download PDF
            </Button>
          ) : (
            <span className="text-regular text-gray" aria-live="polite">
              {STATUS_TEXT[status]}
              {lastEditor && status !== "saving" ? ` · last edit by ${lastEditor}` : ""}
            </span>
          )
        }
        footer={
          readOnly ? undefined : (
            <Button
              variant="primary"
              size="lg"
              disabled={missing.length > 0}
              onClick={() => setConfirming(true)}
            >
              Submit Evaluation
            </Button>
          )
        }
      >
        <div className="text-center">
          {template.titleLines.map((line, i) => (
            <p
              key={line}
              className={`text-subheading leading-[20px] text-black ${i < template.titleLines.length - 1 ? "font-bold" : ""}`}
            >
              {line}
            </p>
          ))}
        </div>

        <div className="mt-[24px] grid grid-cols-2 gap-[16px]">
          <ReadOnlyField label="Program" value={program} />
          <ReadOnlyField label="College/Branch" value={branch} />
          <TextField
            label="Date of Simulation"
            type="date"
            required
            {...field(HEADER_KEYS.visitDate)}
          />
          <TextField label="Area/s Evaluated" required {...field(HEADER_KEYS.areasEvaluated)} />
          <ReadOnlyField label="Level of Survey Visit" value={levelLine} />
          <TextField
            label="Address"
            placeholder="Enter Campus Address"
            {...field(HEADER_KEYS.address)}
          />
        </div>

        <h2 className="mt-[36px] border-b border-[color:var(--color-gray)]/30 pb-[12px] text-center text-subheading font-bold text-black">
          IQAC FINDINGS &amp; RECOMMENDATIONS
        </h2>

        <div className="mt-[20px] flex flex-col gap-[20px]">
          {template.sections.map((section) => (
            <div key={section.key} className={section.indent ? "pl-[32px]" : ""}>
              {section.chosenAreaKey && (
                <div className="mb-[10px]">
                  <TextField
                    label={`${section.label} — area name`}
                    required
                    placeholder="Name of the chosen area"
                    {...field(section.chosenAreaKey)}
                  />
                </div>
              )}
              <TextareaField
                label={section.label}
                required={!section.optional}
                rows={4}
                {...field(section.key)}
              />
            </div>
          ))}
        </div>

        <details className="mt-[32px] rounded-[10px] bg-surface px-[20px] py-[14px]">
          <summary className="cursor-pointer text-regular font-bold italic text-black">
            Reminders
          </summary>
          <ol className="mt-[10px] list-decimal pl-[20px] text-regular leading-[18px] text-black">
            {template.reminders.map((r) => (
              <li key={r} className="mt-[6px]">
                {r}
              </li>
            ))}
          </ol>
        </details>

        <div className="mt-[32px] flex flex-wrap justify-between gap-[32px]">
          <div>
            <p className="text-regular text-black">Evaluated by:</p>
            <div className="mt-[8px] flex flex-wrap gap-[24px]">
              {signatories.map((s) => (
                <SignatureBlock
                  key={s.id}
                  name={s.name}
                  signatureUrl={s.signatureUrl}
                  caption="Internal Quality Assurance Champion"
                  date={signedDate}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-regular text-black">Received by:</p>
            <div className="mt-[8px]">
              <SignatureBlock name=" " signatureUrl={null} caption="QA Coordinator / Chairperson/HAP" />
            </div>
          </div>
        </div>

        {!readOnly && (error || missing.length > 0) && (
          <p className="mt-[20px] text-right text-regular text-gray">
            {error ??
              `${missing.length} required field${missing.length === 1 ? "" : "s"} still blank.`}
          </p>
        )}
      </Panel>

      {confirming && (
        <ConfirmModal
          title="Submit Evaluation"
          message="Once submitted, the sheet is locked for both accreditors and turned into a PDF with your signatures. Continue?"
          confirmLabel="Submit"
          busy={submitting}
          onCancel={() => setConfirming(false)}
          onConfirm={submit}
        />
      )}
    </div>
  );
}
