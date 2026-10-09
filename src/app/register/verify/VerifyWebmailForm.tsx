"use client";

import { useEffect, useState } from "react";
import useNav from "@/components/portal/kit/nav";
import {
  AuthButton,
  AuthCard,
  AuthFormError,
  AuthShell,
  AuthTextField,
  BackLink,
} from "@/components/auth";
import { REGISTER_STEPS } from "../register-options";
import { sendRegistrationOtp, verifyRegistrationOtp } from "../actions";
import {
  draftToAuthMetadata,
  readDraft,
  saveDraft,
  type RegistrationDraft,
} from "../registration-draft";

/**
 * Step 2 of register — confirm the email with a 6-digit code.
 *
 * Verifying only proves the address is the user's: the server marks the
 * temporary code row verified and sets the `qac_reg` cookie that the password
 * step requires. No account exists yet, so Back is safe here.
 *
 * The address is shown so a typo is easy to spot, the countdown digits are
 * `aria-hidden` (a string that changes every second is unlistenable), and the
 * code field is numeric with `autoComplete="one-time-code"`.
 */
const OTP_LENGTH = 6;

function remaining(deadline: number | undefined, now: number): number {
  return deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 0;
}

function clock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VerifyWebmailForm() {
  const router = useNav();
  const [otp, setOtp] = useState("");
  const [draft, setDraft] = useState<RegistrationDraft | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the draft lives in sessionStorage, which does not exist during the server render
    setDraft(readDraft());
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const expiresIn = remaining(draft?.codeExpiresAt, now);
  const resendIn = remaining(draft?.resendAt, now);
  const expired = draft?.codeExpiresAt !== undefined && expiresIn === 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (otp.length !== OTP_LENGTH) {
      setFieldError(`Enter all ${OTP_LENGTH} digits of the code.`);
      return;
    }
    if (!draft) {
      setError("That registration expired. Start again from Create an account.");
      return;
    }

    setFieldError(undefined);
    setError(null);
    setPending(true);

    const result = await verifyRegistrationOtp({ email: draft.webmail, code: otp });
    if (!result.ok) {
      setFieldError(result.error);
      setPending(false);
      return;
    }

    router.push(REGISTER_STEPS.password);
  }

  async function handleResend() {
    if (!draft) {
      setError("That registration expired. Start again from Create an account.");
      return;
    }
    setError(null);
    setFieldError(undefined);
    setResending(true);

    const result = await sendRegistrationOtp({
      email: draft.webmail,
      data: draftToAuthMetadata(draft),
      expertise: draft.expertise,
    });
    setResending(false);

    if (!result.ok) {
      setResent(false);
      setError(result.error);
      return;
    }

    const sentAt = Date.now();
    const next = {
      ...draft,
      codeExpiresAt: sentAt + result.expiresIn * 1000,
      resendAt: sentAt + result.resendIn * 1000,
    };
    saveDraft(next);
    setDraft(next);
    setNow(sentAt);
    setOtp("");
    setResent(true);
  }

  return (
    <AuthShell topRight={<BackLink href="/register" destination="your details" />}>
      <AuthCard
        variant="register"
        step={{ current: 2, total: 4 }}
        title="Verify your email"
        subtitle="Enter the 6-digit code we sent so we know the address is yours."
      >
        <form
          onSubmit={handleSubmit}
          noValidate
          className="auth-stagger flex flex-col gap-[var(--auth-vgap)]"
        >
          {error && <AuthFormError>{error}</AuthFormError>}

          {expired ? (
            <AuthFormError>
              This code has expired. Press Resend code to get a new one.
            </AuthFormError>
          ) : (
            <AuthFormError tone="notice">
              {draft ? (
                <>
                  Code sent to{" "}
                  <span className="font-semibold">{draft.webmail}</span>. Check your
                  inbox, including Junk or Spam. It can take a few minutes, and the
                  code expires 10 minutes after it is sent.
                </>
              ) : (
                "Check your email inbox, including Junk or Spam."
              )}
            </AuthFormError>
          )}

          <AuthTextField
            label="One-time code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d*"
            maxLength={OTP_LENGTH}
            placeholder="000000"
            value={otp}
            error={fieldError}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, ""));
              if (fieldError) setFieldError(undefined);
            }}
            className="text-center font-semibold tracking-[0.5em] [font-variant-numeric:tabular-nums]"
          />

          {draft?.codeExpiresAt !== undefined && !expired && (
            <p aria-hidden className="t-sm text-black/70">
              Code expires in {clock(expiresIn)}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
            <p className="t-sm text-black/70">Didn’t get it?</p>
            <AuthButton
              tone="ghost"
              aria-label="Resend code"
              onClick={handleResend}
              disabled={resendIn > 0}
              loading={resending}
            >
              {resendIn > 0 ? (
                <>
                  Resend code in <span aria-hidden>{resendIn}s</span>
                </>
              ) : (
                "Resend code"
              )}
            </AuthButton>
          </div>

          <p role="status" aria-live="polite" className="sr-only">
            {resent ? "A new code has been sent." : ""}
          </p>

          <AuthButton type="submit" tone="maroon" size="lg" block loading={pending}>
            {pending ? "Verifying…" : "Verify and continue"}
          </AuthButton>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
