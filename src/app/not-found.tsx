import Link from "next/link";

/** Root 404. Renders under the bare root layout (no navbar/footer, no shell —
 *  those live in per-segment layouts a not-found request never reaches). */
export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <p className="t-eyebrow text-maroon">404</p>
      <h1 className="t-h1 text-black">Page not found</h1>
      <p className="t-body max-w-md text-gray">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-4 rounded-full bg-maroon px-6 py-2 text-white transition-opacity hover:opacity-90"
      >
        Back to home
      </Link>
    </div>
  );
}
