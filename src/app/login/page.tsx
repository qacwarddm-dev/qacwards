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
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const { as } = await searchParams;
  return as ? <LoginForm as={as} /> : <RolePicker />;
}
