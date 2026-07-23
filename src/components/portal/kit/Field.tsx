"use client";

import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const SHELL =
  "h-[46px] w-full rounded-[10px] border border-[color:var(--color-gray)]/60 bg-white px-[18px] text-subheading leading-none text-black outline-none placeholder:text-black";

/** Maroon field label above an input. */
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-subheading font-semibold leading-none text-maroon">
      {children}
    </span>
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

export function SelectInput({
  label,
  options,
}: {
  label: string;
  options: string[];
}) {
  return (
    <span className="relative block">
      <select aria-label={label} className={`${SHELL} appearance-none pr-[44px]`}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-[16px] top-1/2 h-[20px] w-[20px] -translate-y-1/2 text-black"
        strokeWidth={2}
        aria-hidden
      />
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
        className={`${SHELL} pr-[52px]`}
      />
      <button
        type="button"
        aria-label={shown ? `Hide ${label}` : `Show ${label}`}
        onClick={() => setShown((s) => !s)}
        className="absolute right-[16px] top-1/2 -translate-y-1/2 text-gray transition-opacity hover:opacity-70"
      >
        <Icon className="h-[20px] w-[20px]" strokeWidth={2} aria-hidden />
      </button>
    </span>
  );
}
