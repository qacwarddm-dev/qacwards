import ProfileForm from "./ProfileForm";

/**
 * assets/FIGMA/register/upload-profile.png — the last step of the register flow
 * (REGISTER_STEPS in ../register-options). Static UI: the chosen picture is
 * previewed locally and discarded, so Next and Skip both land on /login.
 */
export default function ProfilePage() {
  return <ProfileForm />;
}
