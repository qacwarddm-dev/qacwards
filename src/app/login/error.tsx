"use client";

/** Auth screens carry their own frame, so this stays visually independent of
 *  both the public error page and the portal's kit-based one. */
export default function LoginError({
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
        The sign-in page couldn&apos;t load.
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
