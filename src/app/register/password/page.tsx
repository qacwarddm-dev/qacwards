import CreatePasswordForm from "./CreatePasswordForm";

/**
 * assets/FIGMA/register/createpassword.png — step 3 of the register flow
 * (REGISTER_STEPS in ../register-options). Static UI: the password is validated
 * against the frame's own two rules but never stored.
 */
export default function CreatePasswordPage() {
  return <CreatePasswordForm />;
}
