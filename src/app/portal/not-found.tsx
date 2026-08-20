import Link from "next/link";

/** Renders inside `portal/layout.tsx`'s `<main>`, so the sidebar and top bar
 *  stay mounted — a 404 inside the portal never ejects the user from it
 *  (09-ui-refactor §F7). */
export default function PortalNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <p className="t-eyebrow text-maroon">404</p>
      <h1 className="t-h1 text-black">Page not found</h1>
      <p className="t-body max-w-md text-gray">
        That page doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Link
        href="/portal/dashboard"
        className="mt-4 rounded-full bg-maroon px-6 py-2 text-white transition-opacity hover:opacity-90"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
