"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AuthButton,
  AuthCard,
  AuthFormError,
  AuthPasswordField,
  AuthShell,
  BackLink,
} from "@/components/auth";
import { createClient } from "@/lib/supabase/browser";

/**
 * Choose a new password after following the emailed link.
 *
 * Same two rules as the register flow's password step, worded identically — they
 * are the frame's own copy and there is no reason for the two screens to
 * disagree about what a valid password is.
 *
 * ## 2026-08-21 redesign
 *
 * The rules used to be static grey italic lines and the only feedback on meeting
 * them was that the Save button silently stayed disabled. They are a live
 * checklist now (see AuthPasswordField), the confirm mismatch is stated on the
 * field instead of being inferred from an inert button, and the submit is
 * always pressable.
 */
const MIN_LENGTH = 8;

export default function ResetPasswordForm() {
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
      setError("Your new password does not meet the requirements listed below.");
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
    <AuthShell topRight={<BackLink href="/login" destination="sign in" />}>
      <AuthCard
        variant="form"
        title="Choose a new password"
        subtitle="You will be signed in as soon as it is saved."
      >
        <form
          onSubmit={handleSubmit}
          noValidate
          className="auth-stagger flex flex-col gap-[var(--auth-vgap)]"
        >
          {error && <AuthFormError>{error}</AuthFormError>}

          <AuthPasswordField
            label="New password"
            name="new-password"
            autoComplete="new-password"
            placeholder="Enter a new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            rules={rules}
          />

          <AuthPasswordField
            label="Confirm password"
            name="confirm-password"
            autoComplete="new-password"
            placeholder="Re-enter the new password"
            value={confirm}
            error={confirmError}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (confirmError) setConfirmError(undefined);
            }}
          />

          <AuthButton type="submit" tone="maroon" size="lg" block loading={pending}>
            {pending ? "Saving…" : "Save password"}
          </AuthButton>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
