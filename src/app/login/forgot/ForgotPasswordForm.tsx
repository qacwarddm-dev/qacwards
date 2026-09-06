"use client";

import { useState } from "react";
import {
  AuthButton,
  AuthCard,
  AuthFormError,
  AuthShell,
  AuthTextField,
  BackLink,
} from "@/components/auth";
import { createClient } from "@/lib/supabase/browser";

/**
 * Ask for a recovery link.
 *
 * The confirmation is deliberately the same whether or not the address has an
 * account. Saying "no account with that webmail" would turn this form into a
 * free membership oracle — anyone could learn which PUP addresses are registered
 * by typing them in one at a time.
 *
 * ## 2026-08-21 redesign
 *
 * **The sent state used to be a dead end.** It replaced the field with a grey
 * paragraph, removed the button, and left no way to correct a typo or ask again
 * short of reloading — on a screen whose entire purpose is recovering from being
 * locked out. It is now a `role="status"` confirmation that names the address it
 * went to, with a route back to the form and a return to sign-in.
 *
 * Everything else follows the shared changes: announced messages, real
 * `autoComplete`, sentence-case heading, no nested card. See LoginForm.
 */
const SENT =
  "If that webmail has an account, a reset link is on its way. Check your inbox, including spam.";

export default function ForgotPasswordForm() {
  const [webmail, setWebmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const address = webmail.trim();
    if (address === "") {
      setFieldError("Enter your PUP webmail.");
      return;
    }
    setFieldError(undefined);
    setPending(true);

    // The error is intentionally not surfaced, for the reason above.
    await createClient().auth.resetPasswordForEmail(address, {
      redirectTo: `${window.location.origin}/login/reset`,
    });

    setSent(address);
    setPending(false);
  }

  return (
    <AuthShell topRight={<BackLink href="/login" destination="sign in" />}>
      <AuthCard
        variant="form"
        title="Reset your password"
        subtitle={
          sent
            ? undefined
            : "We will email you a link to choose a new one."
        }
      >
        {sent ? (
          <div className="auth-stagger flex flex-col gap-[var(--auth-vgap)]">
            <AuthFormError tone="notice">{SENT}</AuthFormError>
            <p className="t-sm text-pretty text-black/70">
              Sent to <span className="font-semibold text-black">{sent}</span>. The
              link is valid for a short time — request another if it expires.
            </p>
            <div className="flex flex-col gap-[var(--space-3)]">
              <AuthButton href="/login" tone="maroon" size="lg" block>
                Back to sign in
              </AuthButton>
              <AuthButton
                tone="ghost"
                block
                onClick={() => setSent(null)}
              >
                Use a different webmail
              </AuthButton>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="auth-stagger flex flex-col gap-[var(--auth-vgap)]"
          >
            <AuthTextField
              label="PUP Webmail"
              type="email"
              name="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="example@pup.edu.ph"
              value={webmail}
              error={fieldError}
              onChange={(e) => setWebmail(e.target.value)}
            />
            <AuthButton type="submit" tone="maroon" size="lg" block loading={pending}>
              {pending ? "Sending…" : "Send reset link"}
            </AuthButton>
          </form>
        )}
      </AuthCard>
    </AuthShell>
  );
}
