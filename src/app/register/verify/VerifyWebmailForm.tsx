"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AuthButton,
  AuthCard,
  AuthFormError,
  AuthShell,
  AuthTextField,
  BackLink,
} from "@/components/auth";
import { createClient } from "@/lib/supabase/browser";
import { REGISTER_STEPS } from "../register-options";
import { draftToAuthMetadata, readDraft } from "../registration-draft";

/**
 * Step 2 of register — confirm the webmail with a 6-digit code.
 *
 * Verifying the code is what **creates the account**: `verifyOtp` inserts the
 * auth.users row, which fires the @pup.edu.ph trigger and `handle_new_user`
 * (writing the profile and mirroring the role into app_metadata), and signs the
 * user in — so the next step has a session to set a password on.
 *
 * ## 2026-08-21 redesign
 *
 * **The screen never said where the code went.** "A verification code has been
 * sent to your webmail" is the one sentence on this page, and it omits the only
 * fact that lets someone spot the typo they made on the previous step. The
 * address is on screen now, read back out of the draft.
 *
 * **The countdown was announced once a second.** It was plain text in the
 * document; some screen readers re-read a changing string, and one that changes
 * every second for 59 seconds is a form nobody can hear over. The digits are
 * `aria-hidden` and a single polite status fires when resending becomes
 * available.
 *
 * **The code field looked like a name field.** It is now a wide, tracked,
 * numeric field with `autoComplete="one-time-code"`, so iOS and Android offer
 * the code from the notification instead of a keyboard.
 *
 * **Verify was disabled until exactly six digits were typed.** It submits and
 * says what is wrong.
 */
const OTP_LENGTH = 6;
const RESEND_SECONDS = 59;

export default function VerifyWebmailForm() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // Client-only: the draft lives in sessionStorage, which does not exist
    // during the server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setAddress(readDraft()?.webmail ?? null);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (otp.length !== OTP_LENGTH) {
      setFieldError(`Enter all ${OTP_LENGTH} digits of the code.`);
      return;
    }

    const draft = readDraft();
    if (!draft) {
      setError("That registration expired. Start again from Create an account.");
      return;
    }

    setFieldError(undefined);
    setError(null);
    setPending(true);

    const { error: verifyError } = await createClient().auth.verifyOtp({
      email: draft.webmail,
      token: otp,
      type: "email",
    });

    if (verifyError) {
      setFieldError("That code is not valid or has expired.");
      setPending(false);
      return;
    }

    router.push(REGISTER_STEPS.password);
  }

  async function handleResend() {
    const draft = readDraft();
    if (!draft) {
      setError("That registration expired. Start again from Create an account.");
      return;
    }
    setError(null);
    setResent(true);
    setSecondsLeft(RESEND_SECONDS);
    await createClient().auth.signInWithOtp({
      email: draft.webmail,
      options: { shouldCreateUser: true, data: draftToAuthMetadata(draft) },
    });
  }

  return (
    // Back is safe *here and nowhere later in the flow*: `verifyOtp` has not run
    // yet, so no account exists to strand, and step 1's fields are still in the
    // sessionStorage draft for `RegisterForm` to restore. From the password step
    // onward the account is created and signed in, so those screens have no Back.
    <AuthShell topRight={<BackLink href="/register" destination="your details" />}>
      <AuthCard
        variant="register"
        step={{ current: 2, total: 4 }}
        title="Verify your webmail"
        subtitle="Enter the 6-digit code we sent so we know the address is yours."
      >
        <form
          onSubmit={handleSubmit}
          noValidate
          className="auth-stagger flex flex-col gap-[var(--auth-vgap)]"
        >
          {error && <AuthFormError>{error}</AuthFormError>}

          <AuthFormError tone="notice">
            {address ? (
              <>
                Code sent to{" "}
                <span className="font-semibold">{address}</span>. Check your inbox,
                including spam.
              </>
            ) : (
              "Check your PUP webmail inbox, including spam."
            )}
          </AuthFormError>

          <AuthTextField
            label="One-time code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d*"
            maxLength={OTP_LENGTH}
            placeholder="000000"
            value={otp}
            error={fieldError}
            // Digits only, so the length check above is a real completeness test.
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, ""));
              if (fieldError) setFieldError(undefined);
            }}
            className="text-center font-semibold tracking-[0.5em] [font-variant-numeric:tabular-nums]"
          />

          <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
            <p className="t-sm text-black/70">Didn’t get it?</p>
            {secondsLeft > 0 ? (
              <p className="t-sm text-black/70">
                Resend in <span aria-hidden>{secondsLeft}s</span>
                <span className="sr-only">a moment</span>
              </p>
            ) : (
              <AuthButton tone="ghost" onClick={handleResend}>
                Resend code
              </AuthButton>
            )}
          </div>

          {/* Fires once, when the wait ends or a code is re-sent — not on every
              tick of the countdown above. */}
          <p role="status" aria-live="polite" className="sr-only">
            {resent
              ? "A new code has been sent."
              : secondsLeft === 0
                ? "You can now resend the code."
                : ""}
          </p>

          <AuthButton type="submit" tone="maroon" size="lg" block loading={pending}>
            {pending ? "Verifying…" : "Verify and continue"}
          </AuthButton>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
