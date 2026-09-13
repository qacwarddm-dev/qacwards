"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

/**
 * The accreditor specialty chooser — round 2 §3, changed to a dropdown per the
 * 2026-09-06 client note.
 *
 * In the kit because §3 is explicitly two surfaces on one field: the accreditor
 * editing their own Profile, and QAC Admin editing theirs from User Management.
 * The two must offer the same list and the same wording, so they share the
 * component and pass their own data into it.
 *
 * A multi-select dropdown rather than the always-visible chip row this
 * replaced: closed, it reads as one field showing a comma list of what's held
 * (`Field.tsx`'s `SelectMenu` shell); open, it drops the same checkbox list
 * the chips used to be, just collapsed until touched.
 */
export default function ExpertisePicker({
  areas,
  selected,
  onChange,
  disabled = false,
  legend = "Discipline Expertise",
}: {
  areas: { id: string; name: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  legend?: string;
}) {
  const [open, setOpen] = useState(false);
  const held = new Set(selected);

  function toggle(id: string) {
    const next = new Set(held);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }

  if (areas.length === 0) {
    return <p className="t-sm text-gray">No expertise areas are on file yet.</p>;
  }

  const summary =
    selected.length === 0
      ? "None selected"
      : areas
          .filter((a) => held.has(a.id))
          .map((a) => a.name)
          .join(", ");

  const Chevron = open ? ChevronUp : ChevronDown;

  return (
    <div className="min-w-0">
      <span className="block whitespace-nowrap text-regular font-semibold leading-none text-maroon">
        {legend}
      </span>
      <span className="relative mt-[10px] block">
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`flex h-[40px] w-full items-center rounded-[10px] border bg-transparent px-[22px] pr-[40px] text-left text-regular leading-none outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon ${
            open ? "border-maroon" : "border-[color:var(--color-gray)]/50"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <span className="truncate text-black">{summary}</span>
        </button>
        <Chevron
          className={`pointer-events-none absolute right-[14px] top-1/2 h-[17px] w-[17px] -translate-y-1/2 ${open ? "text-maroon" : "text-black"}`}
          strokeWidth={2}
          aria-hidden
        />

        {open && !disabled && (
          <>
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-20 cursor-default"
            />
            <ul
              role="listbox"
              aria-multiselectable="true"
              aria-label={legend}
              className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-[240px] overflow-y-auto rounded-[10px] bg-white py-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
            >
              {areas.map((area) => {
                const on = held.has(area.id);
                return (
                  <li key={area.id}>
                    <label className="relative flex w-full cursor-pointer items-center gap-[10px] px-[22px] py-[11px] text-left text-regular leading-none text-black transition-colors hover:bg-highlight">
                      {on && (
                        <span
                          className="absolute left-0 top-[6px] bottom-[6px] w-[4px] rounded-r-[3px] bg-maroon"
                          aria-hidden
                        />
                      )}
                      <input
                        type="checkbox"
                        role="option"
                        aria-selected={on}
                        checked={on}
                        onChange={() => toggle(area.id)}
                        className="h-[16px] w-[16px] accent-maroon"
                      />
                      <span className={`truncate ${on ? "font-semibold" : ""}`}>{area.name}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </span>
    </div>
  );
}
