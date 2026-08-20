"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef } from "react";
import Card from "./Card";

const SIZES = { sm: "w-[380px]", md: "w-[430px]", lg: "w-[600px]" } as const;

/**
 * Generic overlay dialog (09-ui-refactor §4's `Dialog`, replacing the a11y-
 * bare `Modal` for callback-driven overlays — `Modal` itself keeps its
 * URL-driven `closeHref` variant for existing screens). Focus trap, Escape,
 * scroll lock, `aria-modal`, return-focus on close: the same mechanics as the
 * Phase 0 `Modal` fix, generalised to `open`/`onOpenChange`.
 */
export default function Dialog({
  open,
  onOpenChange,
  closeHref,
  title,
  description,
  size = "md",
  footer,
  children,
  initialFocus,
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Alternative to `onOpenChange` for screens still on the URL-as-state
   *  convention: Escape navigates here instead of calling back. */
  closeHref?: string;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Ref of the element to focus first, overriding "first focusable". */
  initialFocus?: React.RefObject<HTMLElement | null>;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const close = () => (onOpenChange ? onOpenChange(false) : closeHref && router.push(closeHref));

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const node = dialogRef.current;
    const focusable = () =>
      node?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
    (initialFocus?.current ?? focusable()?.[0] ?? node)?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusable();
      if (!items || items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close/initialFocus recreated per render by design; re-running on `open` alone is correct
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-[20px] motion-safe:animate-[toast-in_var(--motion-base)_var(--ease-out)]">
      <Card
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        radius={16}
        className={`flex max-h-[85vh] flex-col p-[28px] outline-none ${SIZES[size]}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id={titleId} className="t-h1 text-black">
              {title}
            </h2>
            {description && (
              <p id={descId} className="t-sm mt-1 text-gray">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="shrink-0 text-black transition-opacity hover:opacity-60"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          </button>
        </div>
        <div className="mt-[20px] overflow-y-auto">{children}</div>
        {footer && <div className="mt-[20px] flex justify-end gap-[12px]">{footer}</div>}
      </Card>
    </div>
  );
}
