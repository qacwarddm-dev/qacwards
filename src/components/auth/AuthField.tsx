"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

/**
 * Auth-screen form field. Measured off assets/FIGMA/login/LoginForm.png:
 * 40px tall, 10px radius, 2px maroon border on white, 12px maroon label above.
 * The register frames (assets/FIGMA/register) draw the same field, which is why
 * the shell and label are exported for the Full Name split-row and AuthSelect to
 * share rather than re-measure.
 *
 * Deliberately not portal/kit/Field — that one is the profile screen's look
 * (46px tall, 1px gray border, 15px type) and the two share no measurement.
 */

/** Field box. Width and colour are left off: the Full Name row sizes its three
 *  boxes individually, and callers set text-black (input) or text-gray (a select
 *  showing its placeholder) without a same-specificity clash against the shell. */
export const AUTH_FIELD_SHELL =
  "h-[40px] rounded-[10px] border-2 border-maroon bg-white px-[14px] text-subheading leading-none outline-none placeholder:text-gray/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon";

/** Maroon field label above an input. */
export function AuthLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-regular leading-none text-maroon">
      {children}
    </span>
  );
}

/** Bare styled input — the shell with no label wrapper, so the Full Name row can
 *  sit three of them under one label. */
export function AuthInput({
  className = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${AUTH_FIELD_SHELL} text-black ${className}`} {...rest} />;
}

export function AuthTextField({
  label,
  ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <AuthLabel>{label}</AuthLabel>
      <AuthInput className="mt-[9px] w-full" {...rest} />
    </label>
  );
}

export function AuthPasswordField({
  label,
  rules,
  ...rest
}: {
  label: string;
  /**
   * Requirement lines between the label and the box, as createpassword.png
   * draws them under "Password": italic gray at the regular size, a 2.5px dot
   * 6px into the content and the text 15.5px in, 12px line pitch. Measured
   * rather than approximated with `list-disc`, whose marker box is not
   * addressable to that precision.
   */
  rules?: string[];
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [shown, setShown] = useState(false);
  const Icon = shown ? Eye : EyeOff;

  return (
    <label className="block">
      <AuthLabel>{label}</AuthLabel>

      {rules && (
        <ul className="mt-[9.5px] text-regular leading-[12px] text-gray italic">
          {rules.map((rule) => (
            <li key={rule} className="flex">
              <span
                aria-hidden
                className="mt-[4.5px] mr-[7px] ml-[6px] h-[2.5px] w-[2.5px] shrink-0 rounded-full bg-gray"
              />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      )}

      <span className="relative mt-[9px] block">
        <input
          type={shown ? "text" : "password"}
          className={`${AUTH_FIELD_SHELL} w-full text-black pr-[42px]`}
          {...rest}
        />
        <button
          type="button"
          aria-label={shown ? "Hide password" : "Show password"}
          onClick={() => setShown((s) => !s)}
          className="absolute top-1/2 right-[13px] -translate-y-1/2 text-maroon transition-opacity hover:opacity-70"
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </button>
      </span>
    </label>
  );
}
