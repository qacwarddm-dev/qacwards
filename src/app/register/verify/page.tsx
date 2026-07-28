import VerifyWebmailForm from "./VerifyWebmailForm";

/**
 * assets/FIGMA/register/verify-webmail.png — step 2 of the register flow
 * (REGISTER_STEPS in ../register-options). Static UI: no code is sent and none
 * is checked, so any 6 digits satisfy Verify OTP.
 */
export default function VerifyWebmailPage() {
  return <VerifyWebmailForm />;
}
