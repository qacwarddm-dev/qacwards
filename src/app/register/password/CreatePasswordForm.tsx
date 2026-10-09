"use client";

import { useState } from "react";
import useNav from "@/components/portal/kit/nav";
import {
  AuthButton,
  AuthCard,
  AuthFormError,
  AuthPasswordField,
  AuthShell,
} from "@/components/auth";
import { createClient } from "@/lib/supabase/browser";
import { REGISTER_STEPS } from "../register-options";
import { completeRegistration } from "../actions";
import { clearDraft } from "../registration-draft";

/**
 * Step 3 of register — set the password.
 *
 * This is the step that creates the account: `completeRegistration` inserts the
 * user and hashes the password in the database (bcrypt, the same hash the
 * sign-in endpoint checks). The page is only reachable with a verified code, see
 * page.tsx. The browser then signs in with the new credentials, so the profile
 * step has a session and the password is proven to work before the user leaves.
 * From here an account exists, which is why this screen and the next carry no
 * Back link.
 */
const MIN_LENGTH = 8;

export default function CreatePasswordForm() {
  const router = useNav();
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

    const created = await completeRegistration(password);
    if (!created.ok) {
      setError(created.error);
      setPending(false);
      return;
    }

    clearDraft();

    const { error: signInError } = await createClient().auth.signInWithPassword({
      email: created.email,
      password,
    });
    if (signInError) {
      router.push("/login");
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
            maxLength={72}
            placeholder="Enter a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            rules={rules}
          />

          <AuthPasswordField
            label="Confirm password"
            autoComplete="new-password"
            maxLength={72}
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
