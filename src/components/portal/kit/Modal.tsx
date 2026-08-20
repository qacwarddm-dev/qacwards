"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import Card from "./Card";

/**
 * Full-screen dialog overlay — internal_accreditor/02.1-Accept-Modal.png and
 * program_representative/07.6-Requirements-modal.png share this shell.
 *
 * Modal state is a URL query param, not component state (every other overlay
 * in the kit is a `Link`-driven route), so `closeHref` closes the dialog by
 * navigating back rather than by an `onClick` handler. Omitting it drops the
 * corner ✕ and centers the title, matching the Accept Confirmation frame,
 * which has no close affordance at all.
 */
export default function Modal({
  title,
  closeHref,
  className = "w-[430px]",
  children,
}: {
  title: string;
  closeHref?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const node = dialogRef.current;
    const focusable = node?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    (focusable?.[0] ?? node)?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (closeHref) router.push(closeHref);
        return;
      }
      if (e.key !== "Tab") return;
      const items = node?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
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
  }, [closeHref, router]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-[20px]">
      <Card
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        radius={16}
        className={`p-[28px] outline-none ${className}`}
      >
        <div className={`flex items-center ${closeHref ? "justify-between" : "justify-center"}`}>
          <h2 id={titleId} className="text-heading font-bold leading-none text-black">
            {title}
          </h2>
          {closeHref && (
            <Link
              href={closeHref}
              aria-label="Close"
              className="text-black transition-opacity hover:opacity-60"
            >
              <X className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            </Link>
          )}
        </div>
        <div className="mt-[20px]">{children}</div>
      </Card>
    </div>
  );
}
