"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthButton, AuthCard, AuthPasswordField, AuthShell } from "@/components/auth";
import { createClient } from "@/lib/supabase/browser";
import { REGISTER_STEPS } from "../register-options";

/**
 * Step 3 of register — assets/FIGMA/register/createpassword.png.
 *
 * This is the one frame that insets its body 64px instead of 44 (250px of
 * content, not 290), hence `contentWidth="narrow"`. Measured from the body top:
 * Password label 36, the two italic rules 13.5 below it at a 12px pitch, field
 * 10 under those, Confirm label 23 under the first field, Next 59.5 below the
 * second, and 58 of air beneath the button.
 *
 * The two rules under "Password" are the frame's own copy, so they are also the
 * validation: Next stays disabled (the frame's muted maroon) until both are
 * satisfied and the two entries match.
 *
 * Wired in B2. The previous step's `verifyOtp` already created the account and
 * signed the user in, so this is `updateUser({ password })` against a live
 * session — an account exists from here on whether or not the user finishes the
 * profile step, which is why Profile's Skip is a legitimate ending.
 */
const RULES = [
  "Must be at least 8 characters long",
  "Must contain one or more numbers",
];

const MIN_LENGTH = 8;

export default function CreatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const meetsRules = password.length >= MIN_LENGTH && /\d/.test(password);
  const canProceed = meetsRules && confirm === password;

  async function handleNext() {
    setError(null);
    setPending(true);

    const { error: updateError } = await createClient().auth.updateUser({ password });

    if (updateError) {
      setError(
        updateError.message.toLowerCase().includes("session")
          ? "That registration expired. Start again from Create an Account."
          : updateError.message,
      );
      setPending(false);
      return;
    }

    router.push(REGISTER_STEPS.profile);
  }

  return (
    <AuthShell align="center">
      <AuthCard variant="register" title="CREATE PASSWORD" contentWidth="narrow">
        <AuthPasswordField
          label="Password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          rules={RULES}
        />

        <div className="mt-[20.5px]">
          <AuthPasswordField
            label="Confirm Password"
            placeholder="Enter Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && (
          <p className="mt-[11px] text-center text-regular leading-tight text-maroon">
            {error}
          </p>
        )}

        <div className="mt-[60px] mb-[29.5px] flex flex-col items-center">
          <AuthButton
            tone="maroon"
            size="pill"
            disabled={!canProceed || pending}
            onClick={handleNext}
          >
            {pending ? "Saving…" : "Next"}
          </AuthButton>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
