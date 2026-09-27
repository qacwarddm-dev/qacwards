"use client";

import { ArrowDownUp, Check } from "lucide-react";
import { useState } from "react";
import Button from "./Button";

export type SortKey = "name" | "modified";
export type SortDir = "asc" | "desc";
export type SortState = { key: SortKey; dir: SortDir };

const KEYS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "modified", label: "Date modified" },
];

const DIRS: { dir: SortDir; label: string }[] = [
  { dir: "asc", label: "A to Z" },
  { dir: "desc", label: "Z to A" },
];

function Option({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <li role="none">
      <button
        type="button"
        role="menuitemradio"
        aria-checked={selected}
        onClick={onClick}
        className={`flex w-full items-center gap-[10px] px-[16px] py-[9px] text-left text-regular leading-none text-black transition-colors hover:bg-highlight ${
          selected ? "bg-surface" : ""
        }`}
      >
        <Check
          className={`h-[14px] w-[14px] shrink-0 ${selected ? "text-maroon" : "invisible"}`}
          strokeWidth={2.5}
          aria-hidden
        />
        {label}
      </button>
    </li>
  );
}

/** The Sort pill in document browsers: sort by field, then A→Z / Z→A. */
export default function SortMenu({
  value,
  onChange,
}: {
  value: SortState;
  onChange: (next: SortState) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <Button
        variant="solid"
        icon={ArrowDownUp}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Sort
      </Button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 cursor-default"
          />
          <div
            role="menu"
            aria-label="Sort"
            className="absolute right-0 top-[calc(100%+6px)] z-30 w-[200px] overflow-hidden rounded-md bg-white py-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
          >
            <p className="px-[16px] pb-[4px] pt-[6px] text-micro leading-none text-gray">Sort by</p>
            <ul role="group">
              {KEYS.map((k) => (
                <Option
                  key={k.key}
                  label={k.label}
                  selected={value.key === k.key}
                  onClick={() => onChange({ ...value, key: k.key })}
                />
              ))}
            </ul>
            <p className="mt-[4px] border-t border-[color:var(--color-gray)]/20 px-[16px] pb-[4px] pt-[10px] text-micro leading-none text-gray">
              Sort direction
            </p>
            <ul role="group">
              {DIRS.map((d) => (
                <Option
                  key={d.dir}
                  label={d.label}
                  selected={value.dir === d.dir}
                  onClick={() => onChange({ ...value, dir: d.dir })}
                />
              ))}
            </ul>
          </div>
        </>
      )}
    </span>
  );
}
