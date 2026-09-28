"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CircleCheck, X } from "lucide-react";
import {
  SCALE,
  stepProblems,
  type Answers,
  type AutoValues,
  type Question,
  type ScaleAnswer,
  type StepProblem,
  type SurveyForm,
} from "@/lib/visit-evaluation-forms";
import Button from "./Button";
import { ReadOnlyValue, TextInput, TextareaInput } from "./Field";
import Modal from "./Modal";
import SuccessCheck from "./SuccessCheck";

export type SurveySaveResult =
  | { ok: true; submittedAt: string | null }
  | { ok: false; error: string };

type SaveState = "idle" | "saving" | "saved" | "failed";

const SAVE_HINT: Record<SaveState, string> = {
  idle: "Your answers are saved as you go",
  saving: "Saving your answers…",
  saved: "Answers saved",
  failed: "Could not save this step. It will retry on the next one.",
};

function longDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
}

export default function SurveyFormModal({
  form,
  who,
  visitLabel,
  auto,
  initial,
  submittedAt,
  remainingAfter,
  onSave,
  onClose,
  onNext,
}: {
  form: SurveyForm;
  who: string | null;
  visitLabel: string;
  auto: AutoValues;
  initial: Answers;
  /** Set when this evaluation was already submitted: opens on the thanks screen. */
  submittedAt: string | null;
  remainingAfter: number;
  onSave: (answers: Answers, submit: boolean) => Promise<SurveySaveResult>;
  onClose: () => void;
  onNext?: () => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initial);
  const [problems, setProblems] = useState<StepProblem[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneAt, setDoneAt] = useState<string | null>(submittedAt);
  const [dirty, setDirty] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const current = form.steps[step];
  const last = step === form.steps.length - 1;
  const alreadySubmitted = submittedAt !== null;

  function set(key: string, value: string | ScaleAnswer) {
    setAnswers((a) => ({ ...a, [key]: value }));
    setProblems((p) => p.filter((x) => x.key !== key));
    setDirty(true);
  }

  function setRow(key: string, row: number, value: number) {
    const prev = (typeof answers[key] === "object" ? answers[key] : {}) as ScaleAnswer;
    setAnswers((a) => ({ ...a, [key]: { ...prev, [row]: value } }));
    setProblems((p) =>
      p
        .map((x) => (x.key === key && x.rows ? { ...x, rows: x.rows.filter((r) => r !== row) } : x))
        .filter((x) => !x.rows || x.rows.length > 0),
    );
    setDirty(true);
  }

  async function autosave(snapshot: Answers) {
    setSaveState("saving");
    const res = await onSave(snapshot, false);
    setSaveState(res.ok ? "saved" : "failed");
    if (res.ok) setDirty(false);
  }

  function close() {
    if (dirty && !doneAt) void onSave(answers, false);
    onClose();
  }

  async function next() {
    const found = stepProblems(current, answers);
    setProblems(found);
    setError(null);
    if (found.length > 0) {
      bodyRef.current
        ?.querySelector(`[data-q="${found[0].key}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!last) {
      void autosave(answers);
      setStep((s) => s + 1);
      return;
    }
    setSubmitting(true);
    const res = await onSave(answers, true);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDoneAt(res.submittedAt ?? new Date().toISOString());
  }

  if (doneAt) {
    return (
      <Modal bare title={form.title} onClose={onClose} className="w-[560px] max-w-full">
        <div className="flex-1 overflow-y-auto px-[28px] pb-[28px] pt-[40px] text-center">
          <SuccessCheck size={72} />
          <p className="mt-[18px] text-heading font-bold leading-tight text-black">
            {alreadySubmitted ? "Already submitted" : "Thank you for your feedback!"}
          </p>
          <p className="mx-auto mt-[8px] max-w-[46ch] text-regular leading-relaxed text-black/70">
            {form.title}
            {who ? ` for ${who}` : ""}, submitted {longDate(doneAt)}. Your responses go straight to
            the QA Center.
          </p>
          {remainingAfter > 0 && (
            <p className="mt-[14px] text-subheading text-black">
              <span className="font-bold">{remainingAfter}</span> evaluation
              {remainingAfter === 1 ? "" : "s"} left for this visit.
            </p>
          )}
        </div>
        <div className="flex justify-end gap-[12px] border-t border-[color:var(--hairline)] px-[28px] py-[14px]">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {remainingAfter > 0 && onNext && (
            <Button variant="primary" iconEnd={ChevronRight} onClick={onNext}>
              Next evaluation
            </Button>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal bare title={form.title} onClose={close} className="w-[720px] max-w-full">
      <div className="border-b border-[color:var(--hairline)] px-[20px] pb-[14px] pt-[22px] sm:px-[28px]">
        <div className="flex items-start justify-between gap-[16px]">
          <div className="min-w-0">
            <p aria-hidden className="text-heading font-bold leading-tight text-black">
              {form.title}
            </p>
            <p className="mt-[4px] text-regular leading-relaxed text-black/70">
              {who && (
                <>
                  Evaluating <span className="font-semibold text-black">{who}</span>,{" "}
                </>
              )}
              {visitLabel}. {form.subtitle}.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="shrink-0 text-black transition-opacity hover:opacity-60"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          </button>
        </div>
        <div className="mt-[14px] flex gap-[6px]" aria-hidden>
          {form.steps.map((s, i) => (
            <span
              key={s.name}
              className={`h-[5px] flex-1 rounded-full transition-colors duration-[var(--motion-slow)] ${
                i <= step ? "bg-maroon" : "bg-highlight"
              }`}
            />
          ))}
        </div>
        <p className="mt-[8px] text-regular text-black/70" aria-live="polite">
          Step {step + 1} of {form.steps.length}: {current.name}
        </p>
      </div>

      <div
        ref={bodyRef}
        key={step}
        className="flex flex-1 animate-[rise-in_var(--motion-slow)_var(--ease-out)] flex-col gap-[24px] overflow-y-auto px-[20px] py-[22px] sm:px-[28px]"
      >
        {current.questions.map((q) => (
          <QuestionField
            key={q.key}
            q={q}
            value={answers[q.key]}
            auto={auto}
            problem={problems.find((p) => p.key === q.key)}
            onChange={(v) => set(q.key, v)}
            onRow={(row, v) => setRow(q.key, row, v)}
          />
        ))}
      </div>

      {error && (
        <p
          role="alert"
          className="border-t border-[color:var(--hairline)] bg-[color:var(--tint-maroon)] px-[28px] py-[10px] text-regular font-semibold text-maroon"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-[12px] border-t border-[color:var(--hairline)] px-[20px] py-[14px] sm:px-[28px]">
        {step > 0 ? (
          <Button variant="secondary" iconStart={ChevronLeft} onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        ) : (
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
        )}
        <span className="hidden text-regular text-black/60 sm:block" aria-live="polite">
          {SAVE_HINT[saveState]}
        </span>
        <Button
          variant="primary"
          iconEnd={last ? undefined : ChevronRight}
          loading={submitting}
          onClick={next}
        >
          {last ? "Submit" : "Next"}
        </Button>
      </div>
    </Modal>
  );
}

function FilledTag() {
  return (
    <span className="ml-[8px] inline-flex items-center gap-[4px] rounded-[6px] bg-[color:var(--tint-approved)] px-[6px] py-[2px] align-middle text-small font-semibold text-black">
      <CircleCheck
        className="h-[11px] w-[11px] text-[color:var(--color-approved)]"
        strokeWidth={2.5}
        aria-hidden
      />
      Filled in for you
    </span>
  );
}

function QuestionLabel({
  q,
  required,
  error,
  tag,
  optional,
}: {
  q: Question;
  required?: boolean;
  error: boolean;
  tag?: boolean;
  optional?: boolean;
}) {
  return (
    <span
      className={`block text-subheading font-semibold leading-snug ${error ? "text-maroon" : "text-black"}`}
    >
      {q.label}
      {required && (
        <span className="ml-[4px] text-maroon" aria-hidden>
          *
        </span>
      )}
      {optional && <span className="ml-[6px] font-normal text-black/60">(optional)</span>}
      {tag && <FilledTag />}
    </span>
  );
}

function QuestionField({
  q,
  value,
  auto,
  problem,
  onChange,
  onRow,
}: {
  q: Question;
  value: Answers[string] | undefined;
  auto: AutoValues;
  problem: StepProblem | undefined;
  onChange: (v: string) => void;
  onRow: (row: number, v: number) => void;
}) {
  const errorLine = problem && (
    <p className="mt-[6px] text-regular font-semibold text-maroon">{problem.message}</p>
  );

  if (q.kind === "auto") {
    return (
      <div data-q={q.key}>
        <QuestionLabel q={q} error={false} tag />
        <div className="mt-[8px]">
          <ReadOnlyValue label={q.label} value={auto[q.key] || "Not on file"} />
        </div>
      </div>
    );
  }

  if (q.kind === "choice") {
    return (
      <fieldset data-q={q.key} aria-invalid={!!problem}>
        <legend className="mb-[8px]">
          <QuestionLabel q={q} required={q.required} error={!!problem} tag={q.prefillVisit} />
        </legend>
        <div className="flex flex-col gap-[6px]">
          {q.options.map((o) => (
            <label
              key={o}
              className="flex cursor-pointer items-center gap-[10px] rounded-[10px] border border-[color:var(--hairline)] px-[12px] py-[9px] text-regular text-black transition-colors duration-[var(--motion-fast)] hover:bg-surface has-[:checked]:border-maroon has-[:checked]:bg-[color:var(--tint-maroon)]"
            >
              <input
                type="radio"
                name={q.key}
                checked={value === o}
                onChange={() => onChange(o)}
                className="h-[16px] w-[16px] shrink-0 accent-[color:var(--color-maroon)]"
              />
              {o}
            </label>
          ))}
        </div>
        {errorLine}
      </fieldset>
    );
  }

  if (q.kind === "scale") {
    const rated = (typeof value === "object" ? value : {}) as ScaleAnswer;
    return (
      <fieldset data-q={q.key} aria-invalid={!!problem}>
        <legend>
          <QuestionLabel q={q} required error={!!problem} />
        </legend>
        <p className="mt-[4px] text-regular text-black/70">{q.hint}</p>
        <table className="mt-[10px] w-full border-collapse text-regular">
          <thead>
            <tr>
              <th className="w-[46%]" />
              {SCALE.map((n) => (
                <th key={n} scope="col" className="px-[4px] pb-[6px] text-center font-semibold text-black/70">
                  {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {q.rows.map((row, i) => {
              const missing = problem?.rows?.includes(i);
              return (
                <tr key={row} className="border-t border-[color:var(--hairline)]">
                  <th
                    scope="row"
                    className={`py-[9px] pr-[8px] text-left font-medium ${missing ? "text-maroon" : "text-black"}`}
                  >
                    {row}
                  </th>
                  {SCALE.map((n) => (
                    <td key={n} className="px-[4px] py-[9px] text-center">
                      <input
                        type="radio"
                        name={`${q.key}-${i}`}
                        aria-label={`${row}: ${n}`}
                        checked={rated[i] === n}
                        onChange={() => onRow(i, n)}
                        className="h-[17px] w-[17px] cursor-pointer accent-[color:var(--color-maroon)]"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {errorLine}
      </fieldset>
    );
  }

  if (q.kind === "score") {
    return (
      <div data-q={q.key}>
        <label htmlFor={`q-${q.key}`}>
          <QuestionLabel q={q} required error={!!problem} />
        </label>
        <p className="mt-[4px] text-regular text-black/70">{q.hint}</p>
        <TextInput
          id={`q-${q.key}`}
          label={q.label}
          type="number"
          inputMode="numeric"
          min={0}
          max={q.max}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!problem}
          className={`mt-[8px] max-w-[140px] ${problem ? "border-maroon" : ""}`}
        />
        {errorLine}
      </div>
    );
  }

  return (
    <div data-q={q.key}>
      <label htmlFor={`q-${q.key}`}>
        <QuestionLabel q={q} error={false} optional />
      </label>
      <TextareaInput
        id={`q-${q.key}`}
        label={q.label}
        rows={3}
        maxLength={2000}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-[8px]"
      />
    </div>
  );
}
