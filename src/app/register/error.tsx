"use client";

/** Draft progress is saved server-side (`registration-draft.ts`), so a boundary
 *  here is a safe reload rather than lost work — the retry always resumes. */
export default function RegisterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
      <h1 className="t-h1 text-black">Something went wrong.</h1>
      <p className="t-body mt-2 text-gray">
        This step didn&apos;t load, but your progress is saved.
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
