"use server";

import { cookies, headers } from "next/headers";
import { sendMail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { createJobClient } from "@/lib/supabase/mailer";
import {
  REGISTRATION_COOKIE,
  REGISTRATION_COOKIE_MAX_AGE,
  encodeRegistrationSession,
  readRegistrationSession,
} from "@/lib/registration-session";

export type SendOtpResult =
  | { ok: true; expiresIn: number; resendIn: number }
  | { ok: false; error: string };

export type VerifyOtpResult = { ok: true } | { ok: false; error: string };

export type CompleteResult = { ok: true; email: string } | { ok: false; error: string };

type RpcResult = {
  ok: boolean;
  reason?: string;
  wait?: number;
  left?: number;
  code?: string | null;
  token?: string;
  email?: string;
  expires_in?: number;
  resend_in?: number;
};

const START_AGAIN = "That registration expired. Start again from Create an account.";

export async function sendRegistrationOtp(input: {
  email: string;
  data: Record<string, string>;
  expertise: string;
}): Promise<SendOtpResult> {
  const email = input.email.trim().toLowerCase();
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "";

  const { client, error: jobError } = await createJobClient();
  if (!client) {
    console.error(`[register:send] mailer account sign-in failed for ${email}:`, jobError);
    return { ok: false, error: "We couldn't send the code just now. Please try again in a minute." };
  }

  const { data, error } = await client.rpc("register_issue_otp", {
    p_email: email,
    p_data: input.data,
    p_expertise: input.expertise,
    p_ip: ip,
  });
  if (error) {
    console.error(`[register:send] storing the code failed for ${email}:`, error.code, error.message);
    return { ok: false, error: "We couldn't start your registration. Please try again." };
  }

  const issued = data as unknown as RpcResult;
  if (!issued.ok) {
    console.warn(`[register:send] refused for ${email}: ${issued.reason}`);
    return { ok: false, error: issueMessage(issued) };
  }

  if (issued.code) {
    const sent = await sendMail(
      email,
      "[QAC-WARDS] Your verification code",
      `Your QAC-WARDS verification code is ${issued.code}.\n\nIt expires in 10 minutes. If you did not try to create an account, you can ignore this email.`,
      { kind: "code", code: issued.code, minutes: 10 },
    );
    if (!sent.ok) {
      console.error(`[register:send] SMTP failed for ${email}:`, sent.error);
      await client.rpc("register_discard_otp", { p_email: email });
      return {
        ok: false,
        error: "We couldn't send the code to that address. Check the email and try again.",
      };
    }
    console.info(`[register:send] code mailed to ${email}`);
  }

  return { ok: true, expiresIn: issued.expires_in ?? 600, resendIn: issued.resend_in ?? 60 };
}

export async function verifyRegistrationOtp(input: {
  email: string;
  code: string;
}): Promise<VerifyOtpResult> {
  const email = input.email.trim().toLowerCase();
  const code = input.code.trim();
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "Enter all 6 digits of the code." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_verify_otp", {
    p_email: email,
    p_code: code,
  });
  if (error) {
    console.error(`[register:verify] rpc failed for ${email}:`, error.code, error.message);
    return { ok: false, error: "We couldn't check the code just now. Please try again." };
  }

  const result = data as unknown as RpcResult;
  if (!result.ok || !result.token) {
    console.warn(`[register:verify] refused for ${email}: ${result.reason}`);
    return { ok: false, error: verifyMessage(result) };
  }

  (await cookies()).set(
    REGISTRATION_COOKIE,
    encodeRegistrationSession({ email, token: result.token }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: REGISTRATION_COOKIE_MAX_AGE,
    },
  );
  return { ok: true };
}

export async function completeRegistration(password: string): Promise<CompleteResult> {
  const session = await readRegistrationSession();
  if (!session) return { ok: false, error: START_AGAIN };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_complete", {
    p_email: session.email,
    p_token: session.token,
    p_password: password,
  });
  if (error) {
    console.error(`[register:complete] insert failed for ${session.email}:`, error.code, error.message);
    return { ok: false, error: "We couldn't create your account. Please try again." };
  }

  const result = data as unknown as RpcResult;
  if (!result.ok) {
    console.warn(`[register:complete] refused for ${session.email}: ${result.reason}`);
    if (result.reason !== "weak_password") (await cookies()).delete(REGISTRATION_COOKIE);
    return { ok: false, error: completeMessage(result) };
  }

  (await cookies()).delete(REGISTRATION_COOKIE);
  console.info(`[register:complete] account created for ${session.email}`);
  return { ok: true, email: result.email ?? session.email };
}

function issueMessage(r: RpcResult): string {
  switch (r.reason) {
    case "invalid_email":
      return "Enter a valid email address.";
    case "invalid_details":
      return "Enter your surname and given name.";
    case "already_registered":
      return "That email already has an account. Log in instead.";
    case "cooldown":
      return `Please wait ${r.wait ?? 60} seconds before asking for another code.`;
    case "too_many":
      return "Too many code requests. Please try again in an hour.";
    default:
      return "We couldn't start your registration. Please try again.";
  }
}

function verifyMessage(r: RpcResult): string {
  switch (r.reason) {
    case "wrong":
      return r.left
        ? `That code is not correct. ${r.left} ${r.left === 1 ? "try" : "tries"} left.`
        : "That code is not correct. Request a new code.";
    case "expired":
      return "That code has expired. Request a new one.";
    case "locked":
      return "Too many wrong tries. Request a new code.";
    default:
      return "No code is waiting for this email. Request a new one.";
  }
}

function completeMessage(r: RpcResult): string {
  switch (r.reason) {
    case "weak_password":
      return "Use 8 to 72 characters with at least one number.";
    case "already_registered":
      return "That email already has an account. Log in instead.";
    default:
      return START_AGAIN;
  }
}
