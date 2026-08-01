"use client";

import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

/**
 * Measured off the Profile frames (identical for every role): 40px tall, 1px
 * #B9B8B8 border, 12px text inset 22px, and **no fill of its own** — the field
 * sits on the panel and lets its #F9F9F9 through, which is why this is
 * `bg-transparent` rather than `bg-white`.
 */
const SHELL_BASE =
  "h-[40px] w-full rounded-[10px] border border-[color:var(--color-gray)]/50 bg-transparent px-[22px] text-regular leading-none outline-none";
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

  return <SelectMenu label={label} options={options ?? []} defaultValue={defaultValue} />;
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
}: {
  label: string;
  options: string[];
  defaultValue?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(defaultValue ?? options[0] ?? "");
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

export function PasswordInput({
  label,
  defaultValue = "",
}: {
  label: string;
  defaultValue?: string;
}) {
  const [shown, setShown] = useState(false);
  const Icon = shown ? Eye : EyeOff;

  return (
    <span className="relative block">
      <input
        type={shown ? "text" : "password"}
        aria-label={label}
        defaultValue={defaultValue}
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
