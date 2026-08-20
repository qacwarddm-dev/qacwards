"use client";

import { Alert, Button } from "@/components/portal/kit";

/** Portal route boundary. Keeps the shell (sidebar + top bar stay mounted,
 *  only `main`'s children are replaced) so a broken page never ejects the
 *  user from the product — 09-ui-refactor §F7. */
export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-[var(--page-gutter)]">
      <Alert tone="error" title="Something went wrong loading this page.">
        {error.digest && <p className="mt-1 text-black/60">Reference: {error.digest}</p>}
      </Alert>
      <Button variant="outline" className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
