"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { AUTH_FIELD_SHELL, AuthLabel } from "./AuthField";

/**
 * Auth-screen dropdown — the System Role / Campus / College / Position selects on
 * assets/FIGMA/register. Same wired behaviour as portal/kit SelectMenu (maroon
 * border + up-chevron open, white menu whose width follows the field, selected
 * row flagged by a maroon left bar, click-away closes) but in the auth field
 * look, and **controlled**: the register form reads `value` to branch which
 * fields it shows next, so the parent owns the selection.
 */
export default function AuthSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const Chevron = open ? ChevronUp : ChevronDown;
  const filled = value !== "";

  return (
    <label className="block">
      <AuthLabel>{label}</AuthLabel>
      <span className="relative mt-[9px] block">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`${AUTH_FIELD_SHELL} flex w-full items-center pr-[40px] text-left ${filled ? "text-black" : "text-gray/50"}`}
        >
          <span className="truncate">{filled ? value : placeholder}</span>
        </button>
        <Chevron
          className="pointer-events-none absolute top-1/2 right-[13px] h-[18px] w-[18px] -translate-y-1/2 text-maroon"
          strokeWidth={2}
          aria-hidden
        />

        {open && (
          <>
            {/* click-away, mirrors the portal SelectMenu */}
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
              className="absolute top-[calc(100%+6px)] right-0 left-0 z-30 max-h-[220px] overflow-auto rounded-[10px] border-2 border-maroon bg-white py-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
            >
              {options.map((o) => {
                const isSelected = o === value;
                return (
                  <li key={o}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(o);
                        setOpen(false);
                      }}
                      className={`relative flex w-full items-center px-[14px] py-[9px] text-left text-subheading leading-none text-black transition-colors hover:bg-highlight ${isSelected ? "font-semibold" : ""}`}
                    >
                      {isSelected && (
                        <span
                          className="absolute top-[5px] bottom-[5px] left-0 w-[4px] rounded-r-[3px] bg-maroon"
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
    </label>
  );
}
