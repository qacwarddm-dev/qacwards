"use client";

import { useState } from "react";
import { AuthButton, AuthCard, AuthPasswordField, AuthShell } from "@/components/auth";
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
 */
const RULES = [
  "Must be at least 8 characters long",
  "Must contain one or more numbers",
];

const MIN_LENGTH = 8;

export default function CreatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const meetsRules = password.length >= MIN_LENGTH && /\d/.test(password);
  const canProceed = meetsRules && confirm === password;

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

        <div className="mt-[60px] mb-[29.5px] flex flex-col items-center">
          <AuthButton
            tone="maroon"
            size="pill"
            disabled={!canProceed}
            href={canProceed ? REGISTER_STEPS.profile : undefined}
          >
            Next
          </AuthButton>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
