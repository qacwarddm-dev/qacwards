"use client";

/** Public site error boundary. Kept dependency-free (no kit import) since the
 *  public site is server-rendered marketing content, not the portal. */
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="t-h1 text-black">This page didn&apos;t load.</h1>
      <p className="t-body mt-2 text-gray">
        Something went wrong on our end.
        {error.digest && ` Reference: ${error.digest}.`}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-maroon px-6 py-2 text-white transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
