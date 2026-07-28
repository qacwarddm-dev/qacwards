"use client";

import { useEffect, useState } from "react";
import { AuthButton, AuthCard, AuthShell, AuthTextField } from "@/components/auth";
import { REGISTER_STEPS } from "../register-options";

/**
 * Step 2 of register — assets/FIGMA/register/verify-webmail.png.
 *
 * Geometry halved off the 2x frame, measured from the body top (card top + the
 * 63px title band): blurb cap-top 55.5, OTP label 139, field 40 tall at full
 * body width, "Resend code in 59s" right-aligned 10.5 under it, Verify OTP 63
 * below that.
 *
 * The countdown is the frame's own "59s". It ticks because a frozen 59 reads as
 * a broken timer, and it is the one piece of state this screen can honestly own
 * without a backend — at zero the text becomes a resend control that restarts
 * it. No code is sent: phase 3a has no mail.
 */
const OTP_LENGTH = 6;
const RESEND_SECONDS = 59;

export default function VerifyWebmailForm() {
  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft === 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const canProceed = otp.length === OTP_LENGTH;

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
              onClick={() => setSecondsLeft(RESEND_SECONDS)}
              className="not-italic underline transition-opacity hover:opacity-70"
            >
              Resend code
            </button>
          )}
        </div>

        <div className="mt-[62px] mb-[7.5px] flex flex-col items-center">
          <AuthButton
            tone="maroon"
            size="pill"
            disabled={!canProceed}
            href={canProceed ? REGISTER_STEPS.password : undefined}
          >
            Verify OTP
          </AuthButton>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
