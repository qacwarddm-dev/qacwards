"use client";

import Link from "next/link";
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
  CAMPUSES,
  COLLEGES,
  MAIN_CAMPUS,
  PUP_POSITIONS,
  REGISTER_STEPS,
  SYSTEM_ROLES,
} from "./register-options";

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
 * Static UI only — there is no backend in phase 3a, so nothing is submitted;
 * Next just advances to the next step of the flow (owner, 2026-07-26):
 * create account -> verify webmail -> create password -> profile. It ships
 * disabled (the frame's muted maroon) until the visible required fields are
 * filled.
 */
const PROGRAM_REP = "Program Representative";

export default function RegisterForm() {
  const [surname, setSurname] = useState("");
  const [given, setGiven] = useState("");
  const [middle, setMiddle] = useState("");
  const [webmail, setWebmail] = useState("");
  const [role, setRole] = useState("");
  const [campus, setCampus] = useState("");
  const [college, setCollege] = useState("");
  const [position, setPosition] = useState("");

  const isProgramRep = role === PROGRAM_REP;
  const showCollege = isProgramRep && campus === MAIN_CAMPUS;
  const showPosition = isProgramRep && campus !== "";

  const canProceed =
    surname !== "" &&
    given !== "" &&
    webmail !== "" &&
    role !== "" &&
    campus !== "" &&
    (!showCollege || college !== "") &&
    (!showPosition || position !== "");

  return (
    <AuthShell align="center">
      <AuthCard variant="register" title="CREATE AN ACCOUNT">
        <form
          onSubmit={(e) => e.preventDefault()}
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
            options={SYSTEM_ROLES}
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
              options={PUP_POSITIONS}
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
            <AuthButton
              tone="maroon"
              size="pill"
              disabled={!canProceed}
              href={canProceed ? REGISTER_STEPS.verify : undefined}
            >
              Next
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
