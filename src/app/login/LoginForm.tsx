"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AuthButton,
  AuthCard,
  AuthPasswordField,
  AuthShell,
  AuthTextField,
  BackLink,
} from "@/components/auth";
import { DEV_USER_COOKIE } from "@/lib/dev-user";
import { resolveDemoRole } from "./demo-login";

/**
 * Credentials form — assets/FIGMA/login/LoginForm.png.
 *
 * There is no backend in phase 3a, so Login is a **demo shortcut**, not real
 * auth: type a role name (e.g. "internal accreditor") in both fields and it
 * sets the same dev cookie `/portal/dev/switch` uses, then lands you on that
 * role's dashboard. See demo-login.ts. The Register link goes to /register.
 */
const REGISTER_PROMPT = "Doesn’t have an Account? ";

export default function LoginForm({ as }: { as?: string }) {
  const router = useRouter();
  const [webmail, setWebmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const role = resolveDemoRole(webmail, password, as);
    if (!role) return; // nothing matched — stay on the form
    // Readable cookie, no session: this only picks the fake person to draw.
    document.cookie = `${DEV_USER_COOKIE}=${role}; path=/; SameSite=Lax`;
    router.push("/portal/dashboard");
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
            <a
              href="#"
              className="mt-[11px] block text-right text-regular leading-none text-maroon underline"
            >
              Forgot Password?
            </a>
          </div>

          <div className="mt-[60.5px]">
            <AuthButton type="submit" tone="maroon" size="pill">
              Login
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
