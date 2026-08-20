"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/portal/kit";
import { sendQueuedEmailsNow } from "@/lib/admin";

/**
 * The manual counterpart to the daily `/api/cron/email` sweep (Vercel Hobby
 * only runs cron once a day). Runs `drainEmailOutbox` on the caller's own
 * session — no `CRON_SECRET`, no mailer job account — so clicking this is what
 * makes the email pipeline demonstrably live: `email_outbox` rows flip to
 * `sent` and the message arrives.
 */
export default function EmailQueuePanel({ pendingCount }: { pendingCount: number }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function send() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const outcome = await sendQueuedEmailsNow();
      if (!outcome.ok) {
        setError(outcome.error);
        return;
      }
      setResult(
        `Claimed ${outcome.claimed}, sent ${outcome.sent}, retrying ${outcome.retrying}, failed ${outcome.failed}.`,
      );
    });
  }

  return (
    <div className="mt-[13px]">
      <div className="flex items-center justify-between">
        <p className="text-regular text-gray">
          {pendingCount > 0
            ? `${pendingCount} email${pendingCount === 1 ? "" : "s"} queued.`
            : "No emails queued right now."}
        </p>
        <Button variant="solid" size="md" disabled={pending} onClick={send}>
          {pending ? "Sending…" : "Send queued emails now"}
        </Button>
      </div>
      {error && <p className="mt-[8px] text-regular text-maroon">{error}</p>}
      {result && <p className="mt-[8px] text-regular text-gray">{result}</p>}
    </div>
  );
}
