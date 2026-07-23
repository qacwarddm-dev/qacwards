"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

/**
 * Auth-screen form field. Measured off assets/FIGMA/login/LoginForm.png:
 * 250x40, 10px radius, 2px maroon border on white, 12px maroon label above.
 *
 * Deliberately not portal/kit/Field — that one is the profile screen's look
 * (46px tall, 1px gray border, 15px type) and the two share no measurement.
 */

const SHELL =
  "h-[40px] w-full rounded-[10px] border-2 border-maroon bg-white px-[14px] text-subheading leading-none text-black outline-none placeholder:text-gray/25";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-regular leading-none text-maroon">
      {children}
    </span>
  );
}

export function AuthTextField({
  label,
  ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input className={`mt-[9px] ${SHELL}`} {...rest} />
    </label>
  );
}

export function AuthPasswordField({ label }: { label: string }) {
  const [shown, setShown] = useState(false);
  const Icon = shown ? Eye : EyeOff;

  return (
    <label className="block">
      <Label>{label}</Label>
      <span className="relative mt-[9px] block">
        <input type={shown ? "text" : "password"} className={`${SHELL} pr-[42px]`} />
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
