"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  AuthButton,
  AuthCard,
  AuthPasswordField,
  AuthShell,
  AuthTextField,
  BackLink,
} from "@/components/auth";
import { createClient } from "@/lib/supabase/browser";
import { safeNextParam } from "@/lib/safe-next";

/**
 * Credentials form — assets/FIGMA/login/LoginForm.png.
 *
 * Real Supabase Auth as of B2; the phase-3a demo shortcut (type a role name to
 * be signed in as it) is gone along with `demo-login.ts` and the dev cookie.
 *
 * `?next=` is where middleware parked the page the user was trying to reach. It
 * is passed through `safeNextParam` rather than used directly — an unchecked
 * `next` is an open redirect, and a login page that forwards to
 * `https://evil.example` after authenticating is worth more to an attacker than
 * most bugs on this screen.
 */
const REGISTER_PROMPT = "Doesn’t have an Account? ";

/** Supabase returns one deliberately vague message for bad email *and* bad
 *  password, and repeating it verbatim is right: distinguishing them tells an
 *  attacker which webmail addresses exist. */
const INVALID = "That webmail and password do not match an account.";

export default function LoginForm({ as }: { as?: string }) {
  void as; // the role picker's ?as= is cosmetic now; the account carries the role
  const router = useRouter();
  const params = useSearchParams();
  const [webmail, setWebmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("deactivated") === "1"
      ? "That account has been deactivated. Contact the Quality Assurance Center."
      : null,
  );
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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
    <AuthShell topRight={<BackLink href="/login" />}>
      <AuthCard variant="form">
        <h1 className="text-center text-heading leading-none font-bold text-maroon">
          LOG IN TO YOUR ACCOUNT
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mt-[20px] flex flex-col items-center rounded-[20px] bg-white pt-[51.5px] pb-[29.5px]"
        >
          <div className="w-[250px]">
            <AuthTextField
              label="PUP Webmail *"
              placeholder="example@pup.edu.ph"
              value={webmail}
              onChange={(e) => setWebmail(e.target.value)}
            />
            <div className="mt-[27px]">
              <AuthPasswordField
                label="Password *"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Link
              href="/login/forgot"
              className="mt-[11px] block text-right text-regular leading-none text-maroon underline"
            >
              Forgot Password?
            </Link>

            {error && (
              <p className="mt-[11px] text-regular leading-tight text-maroon">
                {error}
              </p>
            )}
          </div>

          <div className="mt-[60.5px]">
            <AuthButton
              type="submit"
              tone="maroon"
              size="pill"
              disabled={pending || webmail === "" || password === ""}
            >
              {pending ? "Logging in…" : "Login"}
            </AuthButton>
          </div>

          <p className="mt-[20px] text-regular leading-none text-gray">
            {REGISTER_PROMPT}
            <Link href="/register" className="text-maroon">
              Register
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
