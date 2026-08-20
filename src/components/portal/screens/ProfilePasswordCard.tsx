"use client";

import { KeyRound } from "lucide-react";
import { useState } from "react";
import {
  Button,
  Card,
  FieldLabel,
  PasswordInput,
  SectionHeading,
} from "@/components/portal/kit";
import { createClient } from "@/lib/supabase/browser";

/**
 * The Profile screen's Change Password panel.
 *
 * `updateUser({ password })` does not ask for the current password — the session
 * is the proof of identity. The frame asks for it anyway, and that is worth
 * keeping rather than deleting: it defends the case the session cannot, a walked-
 * away-from logged-in machine. So the current password is verified first by
 * re-signing in with it, and only then is the new one set.
 *
 * Geometry unchanged from the static version: grey box inset 21, the password
 * pair two 312s on a 33px gap.
 */
const MIN_LENGTH = 8;

export default function ProfilePasswordCard({ webmail }: { webmail: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const meetsRules = next.length >= MIN_LENGTH && /\d/.test(next);
  const canSubmit = current !== "" && meetsRules && confirm === next;

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setStatus(null);
  }

  async function handleChange() {
    setStatus(null);
    setBusy(true);
    const supabase = createClient();

    // Proves the person at the keyboard knows the existing password. On success
    // this also refreshes the session, which is harmless.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: webmail,
      password: current,
    });

    if (reauthError) {
      setStatus({ ok: false, text: "Your current password is not correct." });
      setBusy(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: next });

    if (updateError) {
      setStatus({ ok: false, text: updateError.message });
      setBusy(false);
      return;
    }

    reset();
    setStatus({ ok: true, text: "Password changed." });
    setBusy(false);
  }

  return (
    <Card className="min-w-0 flex-1 px-[28px] pt-[19px] pb-[19px]">
      <SectionHeading icon={KeyRound}>CHANGE PASSWORD</SectionHeading>

      <div className="mt-[22px] rounded-[14px] bg-[color:var(--color-gray)]/5 px-[21px] pt-[17px] pb-[13px]">
        <FieldLabel>Current Password</FieldLabel>
        <div className="mt-[10px]">
          <PasswordInput
            label="Current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
        <p className="mt-[8px] text-regular leading-none text-gray">
          Enter your current password to verify your identity
        </p>

        <div className="mt-[20px] grid grid-cols-2 gap-x-[33px]">
          <div>
            <FieldLabel>New Password</FieldLabel>
            <div className="mt-[10px] w-[312px]">
              <PasswordInput
                label="New password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
            </div>
            <ul className="mt-[8px] list-disc pl-[20px] text-regular italic leading-[1.5] text-gray">
              <li>Must be at least 8 characters long</li>
              <li>Must contain one or more numbers</li>
            </ul>
          </div>
          <div>
            <FieldLabel>Confirm New Password</FieldLabel>
            <div className="mt-[10px] w-[312px]">
              <PasswordInput
                label="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <p className="mt-[8px] text-regular italic leading-[1.5] text-gray">
              Must match new password
            </p>
          </div>
        </div>
      </div>

      <div className="mt-[20px] flex items-center justify-end gap-[9px]">
        {status && (
          <p
            className={`mr-auto text-regular leading-tight ${
              status.ok ? "text-gray" : "text-maroon"
            }`}
          >
            {status.text}
          </p>
        )}
        <Button variant="outline" size="lg" onClick={reset} disabled={busy}>
          Reset
        </Button>
        <Button
          variant="solid"
          size="lg"
          onClick={handleChange}
          disabled={!canSubmit || busy}
        >
          {busy ? "Saving…" : "Change Password"}
        </Button>
      </div>
    </Card>
  );
}
