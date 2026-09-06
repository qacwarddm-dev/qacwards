"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  AuthAccountPrompt,
  AuthButton,
  AuthCard,
  AuthFormError,
  AuthPasswordField,
  AuthShell,
  AuthTextField,
  BackLink,
} from "@/components/auth";
import { createClient } from "@/lib/supabase/browser";
import { safeNextParam } from "@/lib/safe-next";

/**
 * Credentials form at `/login?as=<role>`.
 *
 * ## 2026-08-21 redesign
 *
 * **The submit is no longer disabled until the form is filled.** It shipped
 * `disabled={pending || webmail === "" || password === ""}`, which is the single
 * most common accessibility mistake in a sign-in form: the control is inert, the
 * reason is never stated, and a screen-reader user hears "Login, dimmed" with no
 * way to find out what is missing. It submits, and says what is missing.
 *
 * **Errors are announced.** They were a bare `<p>` — rendered, styled maroon,
 * and completely silent to assistive technology. `AuthFormError` is `role=
 * "alert"`, and the field-level messages are wired through `aria-describedby`.
 *
 * **Autofill works now.** No field carried `autoComplete`, `type="email"` or
 * `inputMode`, so password managers did not recognise the form and phones
 * offered the wrong keyboard for an email address.
 *
 * **The nested card is gone**, the heading is sentence case rather than
 * `LOG IN TO YOUR ACCOUNT`, and the 60.5px gap before the button is now the
 * form's own rhythm. See AuthCard for why the two-surface construction went.
 *
 * `?next=` is where middleware parked the page the user was trying to reach. It
 * goes through `safeNextParam` rather than being used directly — an unchecked
 * `next` is an open redirect, and a login page that forwards to
 * `https://evil.example` after authenticating is worth more to an attacker than
 * most bugs on this screen.
 */

/** Supabase returns one deliberately vague message for bad email *and* bad
 *  password, and repeating it verbatim is right: distinguishing them tells an
 *  attacker which webmail addresses exist. */
const INVALID = "That webmail and password do not match an account.";

export default function LoginForm({ as }: { as?: string }) {
  void as; // the role picker's ?as= is cosmetic; the account carries the role
  const router = useRouter();
  const params = useSearchParams();
  const [webmail, setWebmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    webmail?: string;
    password?: string;
  }>({});
  const [error, setError] = useState<string | null>(
    params.get("deactivated") === "1"
      ? "That account has been deactivated. Contact the Quality Assurance Center."
      : null,
  );
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    // Validated here rather than by disabling the button, so the reason is on
    // screen and attached to the field it belongs to.
    const next = {
      webmail: webmail.trim() === "" ? "Enter your PUP webmail." : undefined,
      password: password === "" ? "Enter your password." : undefined,
    };
    setFieldErrors(next);
    if (next.webmail || next.password) {
      setError(null);
      return;
    }

    setError(null);
    setPending(true);

    const { error: signInError } = await createClient().auth.signInWithPassword({
      email: webmail.trim(),
      password,
    });

    if (signInError) {
      setError(
        signInError.message.toLowerCase().includes("email not confirmed")
          ? "Verify your PUP webmail first — check your inbox for the link."
          : INVALID,
      );
      setPending(false);
      return;
    }

    // Deactivation is caught by middleware on the very next request, so a
    // deactivated user who knows their password still gets no further than this.
    router.push(safeNextParam(params.get("next")));
    router.refresh();
  }

  return (
    <AuthShell topRight={<BackLink href="/login" destination="role selection" />}>
      <AuthCard
        variant="form"
        title="Log in to your account"
        subtitle="Use the PUP webmail your account was registered with."
      >
        {/* noValidate: the browser's own bubbles are unstyled, untranslatable
            and vanish on blur. The messages below are ours and they persist. */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="auth-stagger flex flex-col gap-[var(--auth-vgap)]"
        >
          {error && <AuthFormError>{error}</AuthFormError>}

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
            error={fieldErrors.webmail}
            onChange={(e) => setWebmail(e.target.value)}
          />

          <div className="flex flex-col gap-[var(--space-2)]">
            <AuthPasswordField
              label="Password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              error={fieldErrors.password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Link
              href="/login/forgot"
              className="t-sm self-end rounded-[var(--radius-sm)] px-[var(--space-1)] py-[6px] text-maroon underline underline-offset-[3px] hover:no-underline"
            >
              Forgot password?
            </Link>
          </div>

          <div className="flex flex-col items-center gap-[var(--space-4)]">
            <AuthButton type="submit" tone="maroon" size="lg" block loading={pending}>
              {pending ? "Logging in…" : "Log in"}
            </AuthButton>
            <AuthAccountPrompt to="register" />
          </div>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
