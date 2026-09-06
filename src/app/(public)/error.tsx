"use client";

import { RotateCw } from "lucide-react";
import Link from "next/link";

/** Public site error boundary. Kept dependency-free (no kit import) since the
 *  public site is server-rendered marketing content, not the portal.
 *
 *  Redesigned alongside the rest of the public pages so a failure does not drop
 *  the visitor onto a screen that looks like a different product: same index
 *  marker, same gold keyline, same button shapes. It also offers a way out
 *  other than retrying, which it did not before. */
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[var(--content-max)] flex-col items-start px-[var(--page-gutter)] py-[var(--section-y)]">
      <p className="t-index flex items-center gap-3 text-maroon">
        <span aria-hidden>500</span>
        <span aria-hidden className="h-px w-8 bg-maroon/40" />
        <span className="uppercase">Error</span>
      </p>
      <h1 className="t-hero mt-4 font-pup text-maroon">
        This page didn&rsquo;t load.
      </h1>
      <p className="t-lead mt-4 max-w-[52ch] text-black/70">
        Something went wrong on our end, not yours.
        {error.digest ? (
          <>
            {" "}
            Quote reference{" "}
            <span className="font-mono text-black">{error.digest}</span>{" "}
            if you
            report it.
          </>
        ) : null}
      </p>
      <div className="mt-[var(--space-7)] flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full bg-maroon px-6 py-3 text-subheading font-semibold text-white transition-opacity duration-[var(--motion-fast)] hover:opacity-90"
        >
          <RotateCw aria-hidden className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-maroon px-6 py-3 text-subheading font-semibold text-maroon transition-colors duration-[var(--motion-fast)] hover:bg-[var(--tint-maroon)]"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
