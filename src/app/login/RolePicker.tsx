import Image from "next/image";
import { AuthButton, AuthCard, AuthShell } from "@/components/auth";

/**
 * Role picker — assets/FIGMA/login/MainLogin.png. Static UI only: the buttons
 * carry the chosen role to the form as `?as=`, and nothing authenticates yet
 * (phase 3b, plans/03-auth-role-gate.md).
 *
 * The frame offers three roles and no QAC Admin; labels are the frame's own
 * wording, and "Academic Program" is mapped to the program_representative slug.
 */
const ROLES = [
  { label: "Academic Program", slug: "program_representative" },
  { label: "Internal Accreditor", slug: "internal_accreditor" },
  { label: "QAC Personnel", slug: "qac_personnel" },
];

const TAGLINE = "“PUP Ako, Tagumpay Ako!”";
const HEADING = ["Welcome to", "QAC Website"];

export default function RolePicker() {
  return (
    <AuthShell>
      <AuthCard>
        <Image
          src="/assets/logos/pup.png"
          alt="Polytechnic University of the Philippines"
          width={380}
          height={380}
          className="h-[49px] w-[49px]"
        />

        <p className="mt-[11px] text-heading leading-none font-bold text-maroon">
          {TAGLINE}
        </p>

        <h1 className="mt-[52px] text-center text-banner leading-[36px] font-bold text-maroon">
          {HEADING[0]}
          <br />
          {HEADING[1]}
        </h1>

        <p className="mt-[31.5px] text-regular leading-none text-maroon">
          Log in as:
        </p>

        <div className="mt-[16px] flex flex-col gap-[8.5px]">
          {ROLES.map((role) => (
            <AuthButton key={role.slug} href={`/login?as=${role.slug}`}>
              {role.label}
            </AuthButton>
          ))}
        </div>
      </AuthCard>
    </AuthShell>
  );
}
