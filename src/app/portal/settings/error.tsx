"use client";

import { Alert, Button } from "@/components/portal/kit";

/** Settings holds the highest-consequence controls in the product (cycles,
 *  roles); its own boundary means a broken tab never masks the others. */
export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-[var(--page-gutter)]">
      <Alert tone="error" title="This settings page failed to load.">
        {error.digest && <p className="mt-1 text-black/60">Reference: {error.digest}</p>}
      </Alert>
      <Button variant="outline" className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
