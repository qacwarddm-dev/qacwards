"use client";

import { Check, Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

/**
 * Auth-screen form fields.
 *
 * ## What the 2026-08-21 redesign changed
 *
 * **The resting border.** Every field drew a 2px maroon outline. Six of them
 * stacked on the register form gave focus nowhere to land, and a maroon box is
 * the convention for an *invalid* field, so the form read as though it were
 * already complaining. Resting is now a hairline; maroon is spent on focus, as a
 * ring so nothing reflows by a pixel when it lands. See `auth-field` in
 * globals.css.
 *
 * **Height 40 -> 44px** (`--auth-control-h`), the WCAG 2.5.5 target floor. The
 * show/hide password control was an 18px icon with no padding — an 18x18 hit
 * area — and is now a 44px button.
 *
 * **Placeholder contrast.** `placeholder:text-gray/25` computes to about 1.2:1
 * on white. Placeholders are now `text-black/55`, and no field relies on one to
 * carry its label.
 *
 * **Labels are real labels.** `htmlFor`/`id` are generated with `useId` rather
 * than relying on the wrapping `<label>`, which matters because the hint, the
 * error and the password rules are wired to the input through
 * `aria-describedby` — none of that was announced before. An invalid field also
 * carries `aria-invalid`.
 *
 * **Password rules became a live checklist.** They were static grey italic text
 * with a hand-drawn 2.5px bullet, and the only feedback on whether you had met
 * them was that the Next button silently stayed disabled. Each rule now reports
 * its own state, and the list is a polite live region.
 *
 * **`text-gray` is not used here.** #7B7979 is 4.39:1 on white, under the AA
 * floor for body text — the same finding that banned it from the public site
 * (see the note above the type ramp in globals.css). Hints and rules are
 * `text-black/70`.
 */

/** Field box, for the places that need the look without the wrapper: the Full
 *  Name row, which sits three inputs under one legend, and AuthSelect's trigger.
 *  Focus is `focus-visible` on inputs and `focus-within` on composites. */
export const AUTH_FIELD_SHELL =
  "auth-field t-input block placeholder:text-black/55 focus-visible:auth-field-focus";

/** Label above a field. */
export function AuthLabel({
  children,
  htmlFor,
  optional,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  /** Marks the field as not required, which is more useful than starring the
   *  six that are. The frames starred required fields; most fields on these
   *  forms are required, so the star was noise on all but one. */
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="t-label flex items-baseline gap-[var(--space-2)] text-maroon"
    >
      {children}
      {optional && <span className="t-meta text-black/70">Optional</span>}
    </label>
  );
}

/** Bare styled input — no label wrapper. */
export function AuthInput({
  className = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${AUTH_FIELD_SHELL} ${className}`} {...rest} />;
}

/** Hint / error line under a field. Errors are `role="alert"` so they are
 *  announced when they appear rather than sitting silently in the DOM. */
function FieldMessage({
  id,
  error,
  hint,
}: {
  id: string;
  error?: string | null;
  hint?: string;
}) {
  if (error) {
    return (
      <p id={id} role="alert" className="t-sm mt-[var(--space-2)] text-maroon">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={id} className="t-sm mt-[var(--space-2)] text-black/70">
        {hint}
      </p>
    );
  }
  return null;
}

export function AuthTextField({
  label,
  hint,
  error,
  optional,
  className = "",
  ...rest
}: {
  label: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const messageId = `${id}-msg`;
  const described = error || hint ? messageId : undefined;

  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      <AuthLabel htmlFor={id} optional={optional}>
        {label}
      </AuthLabel>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={described}
        className={`${AUTH_FIELD_SHELL} w-full ${
          error ? "border-maroon" : ""
        } ${className}`}
        {...rest}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}

/** One password requirement and whether the current value satisfies it. */
export type PasswordRule = { label: string; met: boolean };

export function AuthPasswordField({
  label,
  rules,
  hint,
  error,
  className = "",
  ...rest
}: {
  label: string;
  /** Live requirement checklist shown under the field. */
  rules?: PasswordRule[];
  hint?: string;
  error?: string | null;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const Icon = shown ? EyeOff : Eye;
  const messageId = `${id}-msg`;
  const rulesId = `${id}-rules`;
  const described =
    [error || hint ? messageId : null, rules ? rulesId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      <AuthLabel htmlFor={id}>{label}</AuthLabel>

      {/* focus-within rather than focus-visible: the box contains two focusable
          things, and the ring belongs to the field, not to whichever of them
          currently holds focus. */}
      <div className="auth-field flex items-center gap-[var(--space-1)] !px-0 focus-within:auth-field-focus">
        <input
          id={id}
          type={shown ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={described}
          className={`t-input min-w-0 flex-1 self-stretch rounded-l-[var(--radius-md)] bg-transparent pl-[var(--space-3)] text-black outline-none placeholder:text-black/55 ${className}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-pressed={shown}
          aria-controls={id}
          aria-label={shown ? "Hide password" : "Show password"}
          className="grid h-[var(--auth-control-h)] w-[var(--auth-control-h)] shrink-0 place-items-center rounded-[var(--radius-md)] text-maroon transition-colors hover:bg-[var(--tint-maroon)]"
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </button>
      </div>

      {rules && (
        <ul
          id={rulesId}
          aria-live="polite"
          className="mt-[var(--space-1)] flex flex-col gap-[var(--space-1)]"
        >
          {rules.map((rule) => (
            <li
              key={rule.label}
              className={`t-sm flex items-center gap-[var(--space-2)] transition-colors duration-[var(--motion-base)] ${
                rule.met ? "text-approved" : "text-black/70"
              }`}
            >
              <span
                aria-hidden
                className={`grid h-[14px] w-[14px] shrink-0 place-items-center rounded-full ${
                  rule.met
                    ? "bg-approved text-white"
                    : "border border-[var(--hairline-strong)]"
                }`}
              >
                {rule.met && <Check className="h-[9px] w-[9px]" strokeWidth={3.5} />}
              </span>
              <span>{rule.label}</span>
              {/* The tick is colour + shape for sighted users; the state has to
                  be in text for everyone else. */}
              <span className="sr-only">{rule.met ? "— met" : "— not met yet"}</span>
            </li>
          ))}
        </ul>
      )}

      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}

/**
 * A group of inputs sharing one label — the register form's Full Name row.
 * A `<fieldset>`/`<legend>`, not a floating `<span>`: three boxes captioned
 * "Full Name" is exactly the case the element exists for, and it is what makes
 * the per-input labels read as "Full Name, Surname" instead of a bare "Surname"
 * detached from anything.
 */
export function AuthFieldGroup({
  legend,
  children,
  error,
}: {
  legend: string;
  children: React.ReactNode;
  error?: string | null;
}) {
  const id = useId();
  return (
    <fieldset className="flex flex-col gap-[var(--space-2)]">
      <legend className="t-label mb-[var(--space-2)] text-maroon">{legend}</legend>
      {children}
      <FieldMessage id={`${id}-msg`} error={error} />
    </fieldset>
  );
}
