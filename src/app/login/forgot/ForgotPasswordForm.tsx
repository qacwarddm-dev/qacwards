"use client";

import { useState } from "react";
import {
  AuthButton,
  AuthCard,
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
 */
const SENT =
  "If that webmail has an account, a reset link is on its way. Check your inbox.";

export default function ForgotPasswordForm() {
  const [webmail, setWebmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);

    // The error is intentionally not surfaced, for the reason above.
    await createClient().auth.resetPasswordForEmail(webmail.trim(), {
      redirectTo: `${window.location.origin}/login/reset`,
    });

    setSent(true);
    setPending(false);
  }

  return (
    <AuthShell topRight={<BackLink href="/login" />}>
      <AuthCard variant="form">
        <h1 className="text-center text-heading leading-none font-bold text-maroon">
          RESET YOUR PASSWORD
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mt-[20px] flex flex-col items-center rounded-[20px] bg-white pt-[51.5px] pb-[29.5px]"
        >
          <div className="w-[250px]">
            {sent ? (
              <p className="text-center text-regular leading-tight text-gray">{SENT}</p>
            ) : (
              <>
                <AuthTextField
                  label="PUP Webmail *"
                  placeholder="example@pup.edu.ph"
                  value={webmail}
                  onChange={(e) => setWebmail(e.target.value)}
                />
                <p className="mt-[11px] text-regular leading-tight text-gray">
                  We will email you a link to choose a new password.
                </p>
              </>
            )}
          </div>

          {!sent && (
            <div className="mt-[60.5px]">
              <AuthButton
                type="submit"
                tone="maroon"
                size="pill"
                disabled={webmail === "" || pending}
              >
                {pending ? "Sending…" : "Send Link"}
              </AuthButton>
            </div>
          )}
        </form>
      </AuthCard>
    </AuthShell>
  );
}
