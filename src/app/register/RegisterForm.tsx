"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AuthAccountPrompt,
  AuthButton,
  AuthCard,
  AuthFieldGroup,
  AuthFormError,
  AuthInput,
  AuthSelect,
  AuthShell,
  AuthTextField,
  BackLink,
} from "@/components/auth";
import {
  ACADEMIC_PROGRAM_LABEL,
  CAMPUSES,
  COLLEGES,
  MAIN_CAMPUS,
  PROGRAM_POSITIONS,
  QAC_POSITIONS,
  QAC_PERSONNEL_LABEL,
  REGISTER_STEPS,
  SYSTEM_ROLES,
} from "./register-options";
import { createClient } from "@/lib/supabase/browser";
import { draftToAuthMetadata, readDraft, saveDraft } from "./registration-draft";

/**
 * Create-an-account form — step 1 of 4.
 *
 * The System Role and Campus selects drive which fields follow:
 *   - Program Representative + Sta. Mesa, Manila  → College / Department appears
 *     between Campus and PUP Position (owner rule, 2026-07-25); any other campus
 *     hides it.
 *   - Program Representative + any campus chosen  → PUP Position appears.
 *
 * Next mails a 6-digit code with `signInWithOtp({ shouldCreateUser: true })` and
 * carries these fields along as auth metadata, so the account is only created
 * when the code is verified on the next step — see registration-draft.ts for why
 * the OTP flow is what fits the frames' order.
 *
 * ## 2026-08-21 redesign
 *
 * **The Full Name row was three fixed-width boxes** — 99px, flexible, 59px — on
 * one line at every viewport, inside a card whose own width was fixed at 382px.
 * Under about 400px of panel that row was unusable. It is a `<fieldset>` now
 * (three inputs under one caption is what the element is for), and it stacks
 * below `sm` rather than compressing.
 *
 * **The revealed fields appear silently.** Choosing "Academic Program" inserts
 * up to two new selects into the middle of the form, which a screen reader had
 * no way of knowing about. The group is a polite live region that says which
 * fields were added.
 *
 * **Next was disabled until every visible required field was filled**, with no
 * statement of which one was missing across a form of up to seven. It submits
 * and reports.
 *
 * **Progress is shown.** Registration is four screens and none of them said so.
 *
 * `RegisterForm` restores its sessionStorage draft **on mount**, not during
 * render: `sessionStorage` does not exist during the server render, so a lazy
 * initialiser would hydrate mismatched.
 */
const ROLE_LABELS = SYSTEM_ROLES.map((r) => r.label);

export default function RegisterForm() {
  const router = useRouter();
  const [surname, setSurname] = useState("");
  const [given, setGiven] = useState("");
  const [middle, setMiddle] = useState("");
  const [webmail, setWebmail] = useState("");
  const [role, setRole] = useState("");
  const [campus, setCampus] = useState("");
  const [college, setCollege] = useState("");
  const [position, setPosition] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const draft = readDraft();
    if (!draft) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a client-only sessionStorage draft; a render-time read would break hydration
    setSurname(draft.surname);
    setGiven(draft.givenName);
    setMiddle(draft.middleInitial);
    setWebmail(draft.webmail);
    setRole(draft.roleLabel);
    setCampus(draft.campus);
    setCollege(draft.college);
    setPosition(draft.position);
  }, []);

  const isProgramRep = role === ACADEMIC_PROGRAM_LABEL;
  const showCollege = isProgramRep && campus === MAIN_CAMPUS;
  const showPosition = isProgramRep && campus !== "";

  /** OtherContext.txt keeps two position lists, one per role. */
  const positions =
    role === QAC_PERSONNEL_LABEL ? QAC_POSITIONS : PROGRAM_POSITIONS;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const next: Record<string, string> = {};
    if (surname.trim() === "") next.name = "Enter your surname and given name.";
    else if (given.trim() === "") next.name = "Enter your given name.";
    if (webmail.trim() === "") next.webmail = "Enter your PUP webmail.";
    if (role === "") next.role = "Choose your system role.";
    if (campus === "") next.campus = "Choose your campus.";
    if (showCollege && college === "") next.college = "Choose your college or department.";
    if (showPosition && position === "") next.position = "Choose your PUP position.";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      setError("Some details are still missing. Check the fields marked below.");
      return;
    }

    setError(null);
    setPending(true);

    const draft = {
      surname,
      givenName: given,
      middleInitial: middle,
      webmail: webmail.trim(),
      roleLabel: role,
      campus,
      college,
      position,
    };

    // The domain rule is also a Postgres trigger on auth.users, which is the one
    // that actually holds — this check only saves a pointless round trip.
    if (!/^[^@\s]+@pup\.edu\.ph$/i.test(draft.webmail)) {
      setErrors({ webmail: "Use your PUP webmail (example@pup.edu.ph)." });
      setPending(false);
      return;
    }

    const { error: otpError } = await createClient().auth.signInWithOtp({
      email: draft.webmail,
      options: { shouldCreateUser: true, data: draftToAuthMetadata(draft) },
    });

    if (otpError) {
      setError(otpError.message);
      setPending(false);
      return;
    }

    saveDraft(draft);
    router.push(REGISTER_STEPS.verify);
  }

  return (
    <AuthShell topRight={<BackLink href="/login" destination="sign in" />}>
      <AuthCard
        variant="register"
        step={{ current: 1, total: 4 }}
        title="Create an account"
        subtitle="Register with your PUP webmail. We will send a code to confirm it."
      >
        <form
          onSubmit={handleSubmit}
          noValidate
          className="auth-stagger flex flex-col gap-[var(--auth-vgap)]"
        >
          {error && <AuthFormError>{error}</AuthFormError>}

          <AuthFieldGroup legend="Full Name" error={errors.name}>
            {/* Stacks below `sm`. The old row held 99px / 1fr / 59px at every
                width, so on a phone the given-name box was a few characters
                wide and "M.I." had no room for its own placeholder. */}
            <div className="grid grid-cols-1 gap-[var(--space-3)] sm:grid-cols-[1fr_1fr_72px]">
              <AuthInput
                aria-label="Surname"
                autoComplete="family-name"
                placeholder="Surname"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
              />
              <AuthInput
                aria-label="Given name"
                autoComplete="given-name"
                placeholder="Given Name"
                value={given}
                onChange={(e) => setGiven(e.target.value)}
              />
              <AuthInput
                aria-label="Middle initial"
                autoComplete="additional-name"
                maxLength={2}
                placeholder="M.I."
                value={middle}
                onChange={(e) => setMiddle(e.target.value)}
              />
            </div>
          </AuthFieldGroup>

          <AuthTextField
            label="PUP Webmail"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="example@pup.edu.ph"
            value={webmail}
            error={errors.webmail}
            onChange={(e) => setWebmail(e.target.value)}
          />

          <AuthSelect
            label="System Role"
            options={ROLE_LABELS}
            value={role}
            onChange={(v) => {
              setRole(v);
              setPosition("");
            }}
            placeholder="Select role"
            error={errors.role}
          />

          <AuthSelect
            label="Campus"
            options={CAMPUSES}
            value={campus}
            onChange={setCampus}
            placeholder="Select campus"
            error={errors.campus}
          />

          {/* Polite live region: choosing a role and campus can insert two more
              selects here, and a form that grows under you without saying so is
              a change no screen reader reports. */}
          <div
            aria-live="polite"
            className="flex flex-col gap-[var(--auth-vgap)] empty:hidden"
          >
            {showCollege && (
              <AuthSelect
                label="College / Department"
                options={COLLEGES}
                value={college}
                onChange={setCollege}
                placeholder="Select college or department"
                error={errors.college}
              />
            )}

            {showPosition && (
              <AuthSelect
                label="PUP Position"
                options={positions}
                value={position}
                onChange={setPosition}
                placeholder="Select position"
                error={errors.position}
              />
            )}
          </div>

          <div className="flex flex-col items-center gap-[var(--space-4)]">
            <AuthButton type="submit" tone="maroon" size="lg" block loading={pending}>
              {pending ? "Sending code…" : "Continue"}
            </AuthButton>
            <AuthAccountPrompt to="login" />
          </div>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
