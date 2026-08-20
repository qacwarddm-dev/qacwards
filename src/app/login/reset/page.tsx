import ResetPasswordForm from "./ResetPasswordForm";

/**
 * Where the emailed recovery link lands. Supabase has already exchanged the link
 * for a session by the time this renders, so the form is a single
 * `updateUser({ password })` — the same call the register flow's password step
 * makes, against a session that arrived by email instead of by OTP.
 */
export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
