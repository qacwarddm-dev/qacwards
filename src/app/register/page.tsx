import RegisterForm from "./RegisterForm";

/**
 * assets/FIGMA/register — the create-an-account form. One route, one interactive
 * form; its System Role / Campus selects reveal the College / Department and PUP
 * Position fields (see RegisterForm). Static UI only, no auth yet (phase 3b).
 */
export default function RegisterPage() {
  return <RegisterForm />;
}
