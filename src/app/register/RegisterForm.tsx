"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AuthButton,
  AuthCard,
  AuthInput,
  AuthLabel,
  AuthSelect,
  AuthShell,
  AuthTextField,
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
import { draftToAuthMetadata, saveDraft } from "./registration-draft";

/**
 * Create-an-account form — assets/FIGMA/register/reg form.png and
 * program-rep-form.png, which are the same form in two states, not two screens.
 *
 * The System Role and Campus selects drive which fields follow:
 *   - Program Representative + Sta. Mesa, Manila  → College / Department appears
 *     between Campus and PUP Position (owner rule, 2026-07-25); any other campus
 *     hides it.
 *   - Program Representative + any campus chosen  → PUP Position appears (the base
 *     frame, with no campus picked, shows neither field).
 *
 * Wired to real auth in B2. Next mails a 6-digit code with
 * `signInWithOtp({ shouldCreateUser: true })` and carries these fields along as
 * auth metadata, so the account is only created when the code is verified on the
 * next step — see registration-draft.ts for why the OTP flow is what fits the
 * frames' order. It ships disabled (the frame's muted maroon) until the visible
 * required fields are filled.
 */
/** The role select stores the owner's label ("Academic Program"), not the database
 *  enum — B0 split the two (register-options.ts SYSTEM_ROLES, open item O-4). */
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
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isProgramRep = role === ACADEMIC_PROGRAM_LABEL;
  const showCollege = isProgramRep && campus === MAIN_CAMPUS;
  const showPosition = isProgramRep && campus !== "";

  /** OtherContext.txt keeps two position lists, one per role. The frame only ever
   *  drew the Academic Program state, so QAC's nine had nowhere to render. */
  const positions =
    role === QAC_PERSONNEL_LABEL ? QAC_POSITIONS : PROGRAM_POSITIONS;

  const canProceed =
    surname !== "" &&
    given !== "" &&
    webmail !== "" &&
    role !== "" &&
    campus !== "" &&
    (!showCollege || college !== "") &&
    (!showPosition || position !== "");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canProceed) return;
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
      setError("Use your PUP webmail (example@pup.edu.ph).");
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
    <AuthShell align="center">
      <AuthCard variant="register" title="CREATE AN ACCOUNT">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-[17px]"
        >
          <div>
            <AuthLabel>Full Name</AuthLabel>
            <div className="mt-[9px] flex gap-[4px]">
              <AuthInput
                aria-label="Surname"
                placeholder="Surname"
                className="w-[99px] shrink-0"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
              />
              <AuthInput
                aria-label="Given Name"
                placeholder="Given Name"
                className="min-w-0 flex-1"
                value={given}
                onChange={(e) => setGiven(e.target.value)}
              />
              <AuthInput
                aria-label="Middle Initial"
                placeholder="M.I."
                className="w-[59px] shrink-0"
                value={middle}
                onChange={(e) => setMiddle(e.target.value)}
              />
            </div>
          </div>

          <AuthTextField
            label="PUP Webmail"
            placeholder="example@pup.edu.ph"
            value={webmail}
            onChange={(e) => setWebmail(e.target.value)}
          />

          <AuthSelect
            label="System Role"
            options={ROLE_LABELS}
            value={role}
            onChange={setRole}
            placeholder="Select Role"
          />

          <AuthSelect
            label="Campus"
            options={CAMPUSES}
            value={campus}
            onChange={setCampus}
            placeholder="Select Campus"
          />

          {showCollege && (
            <AuthSelect
              label="College / Department"
              options={COLLEGES}
              value={college}
              onChange={setCollege}
              placeholder="Select College / Department"
            />
          )}

          {showPosition && (
            <AuthSelect
              label="PUP Position"
              options={positions}
              value={position}
              onChange={setPosition}
              placeholder="Select Position"
            />
          )}

          {/* The frame puts 52.2px between the last field and Next (this 13 plus
              the form's 17 gap). That was measured on the four-field state; the
              six-field one has no frame to measure — program-rep-form.png draws
              no button at all — and there it read as dead air, so the owner
              asked to trim it (2026-07-26). 30px still clears the 17px the
              fields sit apart, so the button stays visibly outside the form. */}
          <div className="mt-[13px] flex flex-col items-center">
            {error && (
              <p className="mb-[11px] text-center text-regular leading-tight text-maroon">
                {error}
              </p>
            )}
            <AuthButton
              type="submit"
              tone="maroon"
              size="pill"
              disabled={!canProceed || pending}
            >
              {pending ? "Sending code…" : "Next"}
            </AuthButton>
            <p className="mt-[17px] text-regular leading-none text-gray">
              Already have an Account?{" "}
              <Link href="/login" className="text-maroon">
                Login
              </Link>
            </p>
          </div>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
