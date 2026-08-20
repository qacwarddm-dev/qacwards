"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AuthButton,
  AuthCard,
  AuthPasswordField,
  AuthShell,
  BackLink,
} from "@/components/auth";
import { createClient } from "@/lib/supabase/browser";

/**
 * Choose a new password after following the emailed link.
 *
 * Same two rules as the register flow's password step, worded identically —
 * they are the frame's own copy and there is no reason for the two screens to
 * disagree about what a valid password is.
 */
const MIN_LENGTH = 8;

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const meetsRules = password.length >= MIN_LENGTH && /\d/.test(password);
  const canSubmit = meetsRules && confirm === password;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const { error: updateError } = await createClient().auth.updateUser({ password });

    if (updateError) {
      // The commonest failure here is an expired or already-used link, which
      // presents as "no session" rather than anything about the password.
      setError(
        updateError.message.toLowerCase().includes("session")
          ? "That reset link has expired. Request a new one."
          : updateError.message,
      );
      setPending(false);
      return;
    }

    router.push("/portal/dashboard");
    router.refresh();
  }

  return (
    <AuthShell topRight={<BackLink href="/login" />}>
      <AuthCard variant="form">
        <h1 className="text-center text-heading leading-none font-bold text-maroon">
          CHOOSE A NEW PASSWORD
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mt-[20px] flex flex-col items-center rounded-[20px] bg-white pt-[51.5px] pb-[29.5px]"
        >
          <div className="w-[250px]">
            <AuthPasswordField
              label="New Password *"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rules={[
                "Must be at least 8 characters long",
                "Must contain one or more numbers",
              ]}
            />
            <div className="mt-[27px]">
              <AuthPasswordField
                label="Confirm Password *"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>

            {error && (
              <p className="mt-[11px] text-regular leading-tight text-maroon">
                {error}
              </p>
            )}
          </div>

          <div className="mt-[60.5px]">
            <AuthButton
              type="submit"
              tone="maroon"
              size="pill"
              disabled={!canSubmit || pending}
            >
              {pending ? "Saving…" : "Save Password"}
            </AuthButton>
          </div>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
