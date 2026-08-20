"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthButton, AuthCard, AuthShell, AuthTextField } from "@/components/auth";
import { createClient } from "@/lib/supabase/browser";
import { REGISTER_STEPS } from "../register-options";
import { draftToAuthMetadata, readDraft } from "../registration-draft";

/**
 * Step 2 of register — assets/FIGMA/register/verify-webmail.png.
 *
 * Geometry halved off the 2x frame, measured from the body top (card top + the
 * 63px title band): blurb cap-top 55.5, OTP label 139, field 40 tall at full
 * body width, "Resend code in 59s" right-aligned 10.5 under it, Verify OTP 63
 * below that.
 *
 * The countdown is the frame's own "59s". At zero the text becomes a resend
 * control, which now really re-sends.
 *
 * Wired in B2. Verifying the code is what **creates the account**: `verifyOtp`
 * inserts the auth.users row, which fires the @pup.edu.ph trigger and
 * `handle_new_user` (writing the profile and mirroring the role into
 * app_metadata), and signs the user in — so the next step has a session to set a
 * password on.
 */
const OTP_LENGTH = 6;
const RESEND_SECONDS = 59;

export default function VerifyWebmailForm() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (secondsLeft === 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const canProceed = otp.length === OTP_LENGTH;

  async function handleVerify() {
    const draft = readDraft();
    if (!draft) {
      setError("That registration expired. Start again from Create an Account.");
      return;
    }

    setError(null);
    setPending(true);

    const { error: verifyError } = await createClient().auth.verifyOtp({
      email: draft.webmail,
      token: otp,
      type: "email",
    });

    if (verifyError) {
      setError("That code is not valid or has expired.");
      setPending(false);
      return;
    }

    router.push(REGISTER_STEPS.password);
  }

  async function handleResend() {
    const draft = readDraft();
    if (!draft) {
      setError("That registration expired. Start again from Create an Account.");
      return;
    }
    setError(null);
    setSecondsLeft(RESEND_SECONDS);
    await createClient().auth.signInWithOtp({
      email: draft.webmail,
      options: { shouldCreateUser: true, data: draftToAuthMetadata(draft) },
    });
  }

  return (
    <AuthShell align="center">
      <AuthCard variant="register" title="VERIFY WEBMAIL">
        <p className="mt-[18.5px] text-center text-regular leading-[15.5px] text-gray">
          A verification code has been sent to your webmail. Please check your
          inbox.
        </p>

        <div className="mt-[52.5px]">
          <AuthTextField
            label="One-Time Password (OTP)"
            placeholder="Enter 6-digit OTP"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            value={otp}
            // Digits only, so the length check below is a real completeness test.
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          />
        </div>

        <div className="mt-[10px] text-right text-regular leading-[12px] text-gray italic">
          {secondsLeft > 0 ? (
            `Resend code in ${secondsLeft}s`
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="not-italic underline transition-opacity hover:opacity-70"
            >
              Resend code
            </button>
          )}
        </div>

        {error && (
          <p className="mt-[11px] text-center text-regular leading-tight text-maroon">
            {error}
          </p>
        )}

        <div className="mt-[62px] mb-[7.5px] flex flex-col items-center">
          <AuthButton
            tone="maroon"
            size="pill"
            disabled={!canProceed || pending}
            onClick={handleVerify}
          >
            {pending ? "Verifying…" : "Verify OTP"}
          </AuthButton>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
