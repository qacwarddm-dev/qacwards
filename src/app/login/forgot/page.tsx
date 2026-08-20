import ForgotPasswordForm from "./ForgotPasswordForm";

/**
 * Forgot password — step one of two. There is no Figma frame for this pair, so
 * both are built from the login screen's own components (`AuthCard variant="form"`,
 * the same 250px field column) rather than inventing a new look.
 */
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
