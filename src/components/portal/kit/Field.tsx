"use client";

import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

/**
 * Measured off the Profile frames (identical for every role): 40px tall, 1px
 * #B9B8B8 border, 12px text inset 22px, and **no fill of its own** — the field
 * sits on the panel and lets its #F9F9F9 through, which is why this is
 * `bg-transparent` rather than `bg-white`.
 */
const SHELL_BASE =
  "h-[40px] w-full rounded-[10px] border border-[color:var(--color-gray)]/50 bg-transparent px-[22px] text-regular leading-none outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon";
const SHELL = `${SHELL_BASE} text-black placeholder:text-black`;

/**
 * Maroon field label above an input. `note` is the grey parenthetical the
 * Profile frame hangs off every locked field — it lives here rather than in the
 * caller's string so the wording cannot drift field to field.
 */
export function FieldLabel({
  note,
  children,
}: {
  note?: string;
  children: React.ReactNode;
}) {
  return (
    // nowrap: with a note attached the label is the widest thing in a 197px
    // column, and letting it wrap pushes that one field's input a line below its
    // neighbours' — the frame keeps every label on one line.
    <span className="block whitespace-nowrap text-regular font-semibold leading-none text-maroon">
      {children}
      {note && <span className="ml-[6px] font-normal text-gray">({note})</span>}
    </span>
  );
}

/**
 * A value the user can read but not edit. Same 40px shell as the inputs so the
 * locked rows line up with the live ones, but grey text and no control — the
 * Profile frame's PERSONAL DETAILS panel is display only.
 */
export function ReadOnlyValue({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <p
      aria-label={label}
      // Internal Accreditor's Discipline Expertise is a long comma list that
      // does not fit its box, and there is no control to expand — the title
      // keeps the full value reachable.
      title={value}
      className={`${SHELL_BASE} flex items-center text-gray ${className}`}
    >
      <span className="truncate">{value}</span>
    </p>
  );
}

/** `FieldLabel` + `ReadOnlyValue`, the shape every locked row on Profile takes
 *  apart from Full Name (one label over three boxes). */
export function ReadOnlyField({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <FieldLabel note="Cannot be changed">{label}</FieldLabel>
      <div className="mt-[10px]">
        <ReadOnlyValue label={label} value={value} />
      </div>
    </div>
  );
}

export function TextInput({
  label,
  className = "",
  ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  // className must merge, not replace — passing one used to drop the whole shell.
  return <input aria-label={label} className={`${SHELL} ${className}`} {...rest} />;
}

/** Swap the shell's resting border for the maroon focus border. */
const shell = (maroon: boolean) =>
  SHELL.replace(
    "border-[color:var(--color-gray)]/50",
    maroon ? "border-maroon" : "border-[color:var(--color-gray)]/50",
  );

export function SelectInput({
  label,
  options,
  value,
  active = false,
  defaultValue,
  onSelect,
}: {
  label: string;
  options?: string[];
  /** When set, renders a filled display control (a truncated selected value)
   *  instead of an option list — the multi-select Discipline Expertise field on
   *  internal_accreditor/05-Profile shows its picks as comma text. */
  value?: string;
  /** The frame draws the focused field with a maroon border and chevron. */
  active?: boolean;
  /** Which option is shown selected before the user touches it; defaults to the
   *  first option (the create-assignment frame pre-selects e.g. "IV"). */
  defaultValue?: string;
  /** Cascading pickers (create-assignment's campus→department→program→level
   *  chain) need to react to a choice, not just display one. Omit for the
   *  original self-contained menu. */
  onSelect?: (value: string) => void;
}) {
  // Display-only branch: a fixed value, no menu. Chevron is decorative.
  if (value !== undefined) {
    return (
      <span className="relative block">
        <button
          type="button"
          aria-label={label}
          className={`${shell(active)} flex items-center pr-[40px]`}
        >
          <span className="truncate">{value}</span>
        </button>
        <ChevronDown
          className={`pointer-events-none absolute right-[14px] top-1/2 h-[17px] w-[17px] -translate-y-1/2 ${active ? "text-maroon" : "text-black"}`}
          strokeWidth={2}
          aria-hidden
        />
      </span>
    );
  }

  return (
    <SelectMenu
      label={label}
      options={options ?? []}
      defaultValue={defaultValue}
      onSelect={onSelect}
    />
  );
}

/**
 * The wired dropdown (qac_personnel/03.1-Create new assignment + the "College
 * Dean" reference popup). Closed it reads as the resting field; open, the
 * trigger takes the maroon border and up-chevron and drops a white menu whose
 * width follows the field, the selected row flagged by a maroon left bar.
 */
function SelectMenu({
  label,
  options,
  defaultValue,
  onSelect,
}: {
  label: string;
  options: string[];
  defaultValue?: string;
  onSelect?: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(defaultValue ?? options[0] ?? "");
  // A cascading picker's `defaultValue` changes out from under this component
  // (department options reset when campus changes). Adjusted during render,
  // not in an effect — React re-renders once more before painting, rather
  // than committing the stale value first and correcting it a frame later.
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);
  if (defaultValue !== prevDefaultValue) {
    setPrevDefaultValue(defaultValue);
    setSelected(defaultValue ?? options[0] ?? "");
  }
  const Chevron = open ? ChevronUp : ChevronDown;

  return (
    <span className="relative block">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`${shell(open)} flex items-center pr-[40px] text-left`}
      >
        <span className="truncate">{selected}</span>
      </button>
      <Chevron
        className={`pointer-events-none absolute right-[14px] top-1/2 h-[17px] w-[17px] -translate-y-1/2 ${open ? "text-maroon" : "text-black"}`}
        strokeWidth={2}
        aria-hidden
      />

      {open && (
        <>
          {/* click-away, mirrors NotificationBell */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 cursor-default"
          />
          <ul
            role="listbox"
            aria-label={label}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-[10px] bg-white py-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
          >
            {options.map((o) => {
              const isSelected = o === selected;
              return (
                <li key={o}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setSelected(o);
                      setOpen(false);
                      onSelect?.(o);
                    }}
                    className={`relative flex w-full items-center px-[22px] py-[11px] text-left text-regular leading-none text-black transition-colors hover:bg-highlight ${isSelected ? "font-semibold" : ""}`}
                  >
                    {isSelected && (
                      <span
                        className="absolute left-0 top-[6px] bottom-[6px] w-[4px] rounded-r-[3px] bg-maroon"
                        aria-hidden
                      />
                    )}
                    <span className="truncate">{o}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </span>
  );
}

/**
 * Password field with a reveal toggle.
 *
 * Takes either `defaultValue` (uncontrolled, which is how the static screens used
 * it) or `value` + `onChange`. B2 needed the controlled form for the real Change
 * Password panel, and giving the component the prop is the right move — the
 * alternative was a second near-identical field living next to this one.
 */
/**
 * `FieldBase` shape shared by the new form fields (09b §9): a visible label
 * (not just `aria-label`), `hint`/`error` wired to `aria-describedby`,
 * `required` and `disabled` reflected both visually and to the DOM. These are
 * additive — `TextInput`/`SelectInput`/`PasswordInput`/`ReadOnlyField` above
 * stay as they are for their existing call sites; new forms (Phase 4/5) reach
 * for these instead.
 */
type FieldBase = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
};

function useFieldIds(id: string | undefined, hasHint: boolean, hasError: boolean) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = hasHint ? `${fieldId}-hint` : undefined;
  const errorId = hasError ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return { fieldId, hintId, errorId, describedBy };
}

function FieldChrome({
  fieldId,
  label,
  required,
  hint,
  hintId,
  error,
  errorId,
  children,
}: {
  fieldId: string;
  label: string;
  required?: boolean;
  hint?: string;
  hintId?: string;
  error?: string;
  errorId?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={fieldId} className="block whitespace-nowrap text-regular font-semibold leading-none text-maroon">
        {label}
        {required && (
          <span className="ml-[2px] text-maroon" aria-hidden>
            *
          </span>
        )}
      </label>
      <div className="mt-[10px]">{children}</div>
      {hint && !error && (
        <p id={hintId} className="mt-[6px] text-small leading-none text-gray">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-[6px] text-small leading-none text-[color:var(--color-alert)]">
          {error}
        </p>
      )}
    </div>
  );
}

const errorShell = "border-[color:var(--color-alert)]";

export function TextField({
  label,
  hint,
  error,
  required,
  disabled,
  id,
  className = "",
  ...rest
}: FieldBase & React.InputHTMLAttributes<HTMLInputElement>) {
  const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, !!hint, !!error);
  return (
    <FieldChrome
      fieldId={fieldId}
      label={label}
      required={required}
      hint={hint}
      hintId={hintId}
      error={error}
      errorId={errorId}
    >
      <input
        id={fieldId}
        required={required}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`${SHELL} ${error ? errorShell : ""} ${disabled ? "opacity-50" : ""} ${className}`}
        {...rest}
      />
    </FieldChrome>
  );
}

export function TextareaField({
  label,
  hint,
  error,
  required,
  disabled,
  id,
  rows = 4,
  counter,
  maxLength,
  className = "",
  ...rest
}: FieldBase & {
  rows?: number;
  counter?: boolean;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, !!hint, !!error);
  const length = typeof rest.value === "string" ? rest.value.length : 0;
  return (
    <FieldChrome
      fieldId={fieldId}
      label={label}
      required={required}
      hint={hint}
      hintId={hintId}
      error={error}
      errorId={errorId}
    >
      <textarea
        id={fieldId}
        rows={rows}
        maxLength={maxLength}
        required={required}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`${SHELL_BASE} h-auto min-h-[80px] resize-y py-[10px] text-black placeholder:text-black ${error ? errorShell : ""} ${disabled ? "opacity-50" : ""} ${className}`}
        {...rest}
      />
      {counter && maxLength && (
        <p className="mt-[4px] text-right text-small leading-none text-gray">
          {length}/{maxLength}
        </p>
      )}
    </FieldChrome>
  );
}

export function SelectField({
  label,
  hint,
  error,
  required,
  disabled,
  id,
  options,
  placeholder,
  className = "",
  ...rest
}: FieldBase & {
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, !!hint, !!error);
  return (
    <FieldChrome
      fieldId={fieldId}
      label={label}
      required={required}
      hint={hint}
      hintId={hintId}
      error={error}
      errorId={errorId}
    >
      <select
        id={fieldId}
        required={required}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`${SHELL} ${error ? errorShell : ""} ${disabled ? "opacity-50" : ""} ${className}`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldChrome>
  );
}

export function PasswordField({
  label,
  hint,
  error,
  required,
  disabled,
  id,
  className = "",
  ...rest
}: FieldBase & React.InputHTMLAttributes<HTMLInputElement>) {
  const [shown, setShown] = useState(false);
  const Icon = shown ? Eye : EyeOff;
  const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, !!hint, !!error);
  return (
    <FieldChrome
      fieldId={fieldId}
      label={label}
      required={required}
      hint={hint}
      hintId={hintId}
      error={error}
      errorId={errorId}
    >
      <span className="relative block">
        <input
          id={fieldId}
          type={shown ? "text" : "password"}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`${SHELL} pr-[46px] ${error ? errorShell : ""} ${disabled ? "opacity-50" : ""} ${className}`}
          {...rest}
        />
        <button
          type="button"
          aria-label={shown ? `Hide ${label}` : `Show ${label}`}
          onClick={() => setShown((s) => !s)}
          className="absolute right-[14px] top-1/2 -translate-y-1/2 text-gray transition-opacity hover:opacity-70"
        >
          <Icon className="h-[17px] w-[17px]" strokeWidth={2} aria-hidden />
        </button>
      </span>
    </FieldChrome>
  );
}

export function PasswordInput({
  label,
  defaultValue,
  value,
  onChange,
}: {
  label: string;
  defaultValue?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}) {
  const [shown, setShown] = useState(false);
  const Icon = shown ? Eye : EyeOff;
  const controlled = value !== undefined;

  return (
    <span className="relative block">
      <input
        type={shown ? "text" : "password"}
        aria-label={label}
        {...(controlled
          ? { value, onChange }
          : { defaultValue: defaultValue ?? "" })}
        className={`${SHELL} pr-[46px]`}
      />
      <button
        type="button"
        aria-label={shown ? `Hide ${label}` : `Show ${label}`}
        onClick={() => setShown((s) => !s)}
        className="absolute right-[14px] top-1/2 -translate-y-1/2 text-gray transition-opacity hover:opacity-70"
      >
        <Icon className="h-[17px] w-[17px]" strokeWidth={2} aria-hidden />
      </button>
    </span>
  );
}
