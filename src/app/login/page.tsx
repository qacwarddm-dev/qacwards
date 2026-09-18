import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import LoginForm from "./LoginForm";
import RolePicker from "./RolePicker";

/**
 * Two frames, one route: assets/FIGMA/login/MainLogin.png is the role picker at
 * `/login`, and LoginForm.png is `/login?as=<role>` — the picker's buttons carry
 * the choice, and the form's Back link drops it again.
 *
 * The role is a UI hint only; nothing authenticates yet and no session exists
 * (phase 3b, plans/03-auth-role-gate.md). When auth lands, the role must be
 * pinned by the invite or the account, never by this query string.
 *
 * A still-valid session lands here too — the public Navbar always links "Sign
 * in" to `/login` because it has no way to know who's browsing (route group,
 * no middleware). Bouncing straight to the dashboard is what stops that from
 * reading as "logged out" and forcing a real re-login.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/portal/dashboard");

  const { as } = await searchParams;
  return as ? <LoginForm as={as} /> : <RolePicker />;
}
