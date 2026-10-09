import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const REGISTRATION_COOKIE = "qac_reg";
export const REGISTRATION_COOKIE_MAX_AGE = 30 * 60;

export type RegistrationSession = { email: string; token: string };

export function encodeRegistrationSession(session: RegistrationSession): string {
  return Buffer.from(JSON.stringify(session)).toString("base64url");
}

export async function readRegistrationSession(): Promise<RegistrationSession | null> {
  const raw = (await cookies()).get(REGISTRATION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed?.email === "string" && typeof parsed?.token === "string") {
      return { email: parsed.email, token: parsed.token };
    }
  } catch {}
  return null;
}

export async function verifiedRegistration(): Promise<RegistrationSession | null> {
  const session = await readRegistrationSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_check_token", {
    p_email: session.email,
    p_token: session.token,
  });

  if (error) {
    console.error("[register:gate] token check failed:", error.code, error.message);
    return null;
  }
  return data === true ? session : null;
}
