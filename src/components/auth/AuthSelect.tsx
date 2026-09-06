"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

/**
 * Auth-screen dropdown — System Role / Campus / College / Position.
 *
 * ## Why this was rewritten in the 2026-08-21 pass
 *
 * The previous version was a listbox in markup only. It had `role="listbox"` and
 * `role="option"` on a stack of `<button>`s and **no keyboard handling of any
 * kind**: no arrow keys, no Escape, no typeahead, no focus management, no
 * `aria-activedescendant`. Opening it moved focus nowhere, so a keyboard user
 * tabbed through 23 campus options one at a time to reach "Sta. Rosa", and a
 * screen reader was told this was a listbox while none of a listbox's behaviour
 * was there. Registration was, in practice, not completable without a mouse.
 *
 * It also wrapped the trigger in a `<label>`, which associates with form
 * controls only — a `<button>` is not one, so the label was decorative text.
 *
 * This is the APG select-only combobox: focus stays on the trigger the whole
 * time and `aria-activedescendant` moves instead, which is what lets Escape and
 * Tab behave the way people expect without a focus-restoration dance.
 *
 * Typeahead is not a nicety on these lists. Campus has 23 entries and the
 * accreditor expertise list has 84; without it the only way down is to hold an
 * arrow key.
 *
 * Still **controlled** — the register form branches on `value` to decide which
 * fields come next, so the parent owns the selection.
 */

/** How long consecutive keystrokes are treated as one typeahead query. */
const TYPEAHEAD_MS = 600;

export default function AuthSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
  hint,
  error,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  hint?: string;
  error?: string | null;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const listId = `${id}-list`;
  const messageId = `${id}-msg`;
  const optionId = (i: number) => `${id}-opt-${i}`;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  /** Which way the menu opens. A 260px list under a field near the bottom of a
   *  short viewport otherwise renders off-screen, and the panel does not scroll
   *  to reach it because the menu is absolutely positioned. */
  const [drop, setDrop] = useState<"down" | "up">("down");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ query: "", at: 0 });

  const filled = value !== "";

  // Click-away. A document listener rather than the full-screen transparent
  // <button> this used to render: that element was in the tab order's way, sat
  // over the page at z-20, and swallowed scroll gestures on touch.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the active option in view — the whole point of arrow keys on a
  // `max-h` list is that the list follows you.
  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current
      ?.querySelector(`#${CSS.escape(optionId(active))}`)
      ?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optionId is derived from a stable useId
  }, [open, active]);

  const MENU_MAX = 260;

  const openAt = (index: number) => {
    const box = triggerRef.current?.getBoundingClientRect();
    if (box) {
      const below = window.innerHeight - box.bottom;
      setDrop(below < MENU_MAX && box.top > below ? "up" : "down");
    }
    setActive(Math.max(0, Math.min(index, options.length - 1)));
    setOpen(true);
  };

  const commit = (index: number) => {
    if (index < 0 || index >= options.length) return;
    onChange(options[index]);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const selectedIndex = options.indexOf(value);

  const typeahead = (char: string) => {
    const now = Date.now();
    const query =
      now - typed.current.at < TYPEAHEAD_MS ? typed.current.query + char : char;
    typed.current = { query, at: now };

    const from = (open ? active : selectedIndex) + 1;
    // Wrap, so typing "s" repeatedly walks the S-campuses instead of stopping.
    for (let step = 0; step < options.length; step += 1) {
      const i = (from + step) % options.length;
      if (options[i].toLowerCase().startsWith(query.toLowerCase())) {
        if (open) setActive(i);
        else onChange(options[i]);
        return;
      }
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const { key } = event;

    if (key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
      }
      return;
    }

    if (key === "Tab") {
      setOpen(false);
      return;
    }

    if (key === "ArrowDown" || key === "ArrowUp") {
      event.preventDefault();
      if (!open) return openAt(selectedIndex < 0 ? 0 : selectedIndex);
      return setActive((i) =>
        key === "ArrowDown"
          ? Math.min(i + 1, options.length - 1)
          : Math.max(i - 1, 0),
      );
    }

    if (key === "Home" || key === "End") {
      if (!open) return;
      event.preventDefault();
      return setActive(key === "Home" ? 0 : options.length - 1);
    }

    // Space is overloaded on a select-only combobox: it selects, except while a
    // typeahead string is in flight, where it is part of what is being typed.
    // Without this exception no option containing a space is reachable by
    // typing — "Sta. Mesa, Manila" commits on the space after the full stop and
    // lands on "Sta. Maria" instead, which is a different campus with different
    // downstream fields.
    const typingRun =
      typed.current.query !== "" && Date.now() - typed.current.at < TYPEAHEAD_MS;

    if (key === "Enter" || (key === " " && !typingRun)) {
      event.preventDefault();
      if (!open) return openAt(selectedIndex < 0 ? 0 : selectedIndex);
      return commit(active);
    }

    if (key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      typeahead(key);
    }
  };

  const described =
    [error || hint ? messageId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      <span id={labelId} className="t-label text-maroon">
        {label}
      </span>

      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-controls={listId}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-labelledby={`${labelId} ${id}-value`}
          aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={described}
          onClick={() => (open ? setOpen(false) : openAt(selectedIndex < 0 ? 0 : selectedIndex))}
          onKeyDown={onKeyDown}
          className={`auth-field flex w-full items-center gap-[var(--space-2)] pr-[var(--space-2)] text-left focus-visible:auth-field-focus ${
            error ? "border-maroon" : ""
          }`}
        >
          <span
            id={`${id}-value`}
            className={`t-input min-w-0 flex-1 truncate ${
              filled ? "text-black" : "text-black/55"
            }`}
          >
            {filled ? value : placeholder}
          </span>
          <ChevronDown
            className={`h-[18px] w-[18px] shrink-0 text-maroon transition-transform duration-[var(--motion-fast)] ${
              open ? "rotate-180" : ""
            }`}
            strokeWidth={2}
            aria-hidden
          />
        </button>

        {open && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={labelId}
            tabIndex={-1}
            className={`absolute right-0 left-0 z-30 ${
              drop === "up" ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"
            } max-h-[min(260px,50vh)] overflow-auto overscroll-contain rounded-[var(--radius-md)] border border-[var(--hairline-strong)] bg-white p-[var(--space-1)] shadow-[var(--elev-3)]`}
          >
            {options.map((option, i) => {
              const isSelected = option === value;
              return (
                <li
                  key={option}
                  id={optionId(i)}
                  role="option"
                  aria-selected={isSelected}
                  // Pointer, not click: the document pointerdown handler above
                  // would otherwise close the list before the click landed.
                  onPointerDown={(e) => {
                    e.preventDefault();
                    commit(i);
                  }}
                  onPointerEnter={() => setActive(i)}
                  className={`t-body flex cursor-pointer items-center gap-[var(--space-2)] rounded-[var(--radius-sm)] px-[var(--space-3)] py-[10px] text-black ${
                    i === active ? "bg-[var(--tint-maroon)]" : ""
                  } ${isSelected ? "font-semibold" : ""}`}
                >
                  <span
                    aria-hidden
                    className={`h-[14px] w-[3px] shrink-0 rounded-full ${
                      isSelected ? "bg-maroon" : "bg-transparent"
                    }`}
                  />
                  <span className="min-w-0 flex-1">{option}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {error ? (
        <p id={messageId} role="alert" className="t-sm text-maroon">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="t-sm text-black/70">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
