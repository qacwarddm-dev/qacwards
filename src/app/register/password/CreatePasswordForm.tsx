"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AuthButton,
  AuthCard,
  AuthFormError,
  AuthPasswordField,
  AuthShell,
} from "@/components/auth";
import { createClient } from "@/lib/supabase/browser";
import { REGISTER_STEPS } from "../register-options";

/**
 * Step 3 of register — set the password.
 *
 * The previous step's `verifyOtp` already created the account and signed the
 * user in, so this is `updateUser({ password })` against a live session. An
 * account exists from here on whether or not the user finishes the profile step,
 * which is why Profile's Skip is a legitimate ending — and why this screen and
 * the next deliberately carry no Back link.
 *
 * ## 2026-08-21 redesign
 *
 * **The two requirements are live.** They were static grey italic lines with a
 * hand-drawn 2.5px bullet and no connection to the field or to the button they
 * governed; the only feedback on satisfying them was that Next stopped being
 * grey. Each now reports its own state, in text as well as colour, and is bound
 * to the input through `aria-describedby`.
 *
 * **The mismatch is stated.** Typing two different passwords produced no message
 * at all — the button simply stayed inert.
 *
 * **`contentWidth="narrow"` is gone.** This was the one frame that inset its
 * body 64px instead of 44, which the earlier notes already flagged as a probable
 * design slip; the card has one inset now.
 */
const MIN_LENGTH = 8;

export default function CreatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const rules = [
    { label: "At least 8 characters long", met: password.length >= MIN_LENGTH },
    { label: "Contains one or more numbers", met: /\d/.test(password) },
  ];
  const meetsRules = rules.every((rule) => rule.met);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!meetsRules) {
      setError("Your password does not meet the requirements listed below.");
      return;
    }
    if (confirm !== password) {
      setError(null);
      setConfirmError("The two passwords do not match.");
      return;
    }

    setConfirmError(undefined);
    setError(null);
    setPending(true);

    const { error: updateError } = await createClient().auth.updateUser({ password });

    if (updateError) {
      setError(
        updateError.message.toLowerCase().includes("session")
          ? "That registration expired. Start again from Create an account."
          : updateError.message,
      );
      setPending(false);
      return;
    }

    router.push(REGISTER_STEPS.profile);
  }

  return (
    <AuthShell>
      <AuthCard
        variant="register"
        step={{ current: 3, total: 4 }}
        title="Create a password"
        subtitle="This is what you will sign in with from now on."
      >
        <form
          onSubmit={handleSubmit}
          noValidate
          className="auth-stagger flex flex-col gap-[var(--auth-vgap)]"
        >
          {error && <AuthFormError>{error}</AuthFormError>}

          <AuthPasswordField
            label="Password"
            autoComplete="new-password"
            placeholder="Enter a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            rules={rules}
          />

          <AuthPasswordField
            label="Confirm password"
            autoComplete="new-password"
            placeholder="Re-enter the password"
            value={confirm}
            error={confirmError}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (confirmError) setConfirmError(undefined);
            }}
          />

          <AuthButton type="submit" tone="maroon" size="lg" block loading={pending}>
            {pending ? "Saving…" : "Continue"}
          </AuthButton>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
