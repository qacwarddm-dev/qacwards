import Link from "next/link";

/** Root 404. Renders under the bare root layout (no navbar/footer, no shell —
 *  those live in per-segment layouts a not-found request never reaches), which
 *  is exactly why it carries the brand marks itself: without them it is an
 *  unbranded white page mid-session. */
export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-[var(--content-max)] flex-1 flex-col items-start justify-center px-[var(--page-gutter)] py-[var(--section-y)]">
      <p className="t-index flex items-center gap-3 text-maroon">
        <span aria-hidden>404</span>
        <span aria-hidden className="h-px w-8 bg-maroon/40" />
        <span className="uppercase">Not found</span>
      </p>
      <h1 className="t-hero mt-4 font-pup text-maroon">Page not found</h1>
      <p className="t-lead mt-4 max-w-[52ch] text-black/70">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
      </p>
      <div className="mt-[var(--space-7)] flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-maroon px-6 py-3 text-subheading font-semibold text-white transition-opacity duration-[var(--motion-fast)] hover:opacity-90"
        >
          Back to home
        </Link>
        <Link
          href="/about"
          className="inline-flex items-center gap-2 rounded-full border border-maroon px-6 py-3 text-subheading font-semibold text-maroon transition-colors duration-[var(--motion-fast)] hover:bg-[var(--tint-maroon)]"
        >
          About the Center
        </Link>
      </div>
    </div>
  );
}
