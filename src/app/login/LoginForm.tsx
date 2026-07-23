import {
  AuthButton,
  AuthCard,
  AuthPasswordField,
  AuthShell,
  AuthTextField,
  BackLink,
} from "@/components/auth";

/**
 * Credentials form — assets/FIGMA/login/LoginForm.png. Static UI: nothing
 * submits, and the Register link is inert because `register/` is deferred and
 * `/register` does not exist (it would 404).
 */
const REGISTER_PROMPT = "Doesn’t have an Account? ";

export default function LoginForm() {
  return (
    <AuthShell variant="form" topRight={<BackLink href="/login" />}>
      <AuthCard variant="form">
        <h1 className="text-center text-heading leading-none font-bold text-maroon">
          LOG IN TO YOUR ACCOUNT
        </h1>

        <div className="mt-[20px] flex flex-col items-center rounded-[20px] bg-white pt-[51.5px] pb-[29.5px]">
          <div className="w-[250px]">
            <AuthTextField label="PUP Webmail *" placeholder="example@pup.edu.ph" />
            <div className="mt-[27px]">
              <AuthPasswordField label="Password *" />
            </div>
            <a
              href="#"
              className="mt-[11px] block text-right text-regular leading-none text-maroon underline"
            >
              Forgot Password?
            </a>
          </div>

          <div className="mt-[60.5px]">
            <AuthButton tone="maroon" size="pill">
              Login
            </AuthButton>
          </div>

          <p className="mt-[20px] text-regular leading-none text-gray">
            {REGISTER_PROMPT}
            <span className="text-maroon">Register</span>
          </p>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
