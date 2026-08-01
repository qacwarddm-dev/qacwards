import {
  CircleUserRound,
  IdCard,
  KeyRound,
  Mail,
  SquarePen,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { PROFILES } from "@/components/portal/data";
import { getCurrentUser } from "@/lib/current-user";
import {
  Button,
  Card,
  FieldLabel,
  PasswordInput,
  ReadOnlyField,
  ReadOnlyValue,
  SectionHeading,
} from "@/components/portal/kit";

/**
 * Profile — one screen for every role, per the owner's 2026-08-01 revision.
 *
 * Four panels on a 2x2: Profile (photo) beside Personal Details, then Account
 * Access beside Change Password. Columns are the same 260 / 15 / 753 split
 * inside 81px page padding that the previous layout measured, so the panel edges
 * still line up with the rest of the portal.
 *
 * Row one stretches: the frame draws both cards the same height and Personal
 * Details is the taller content, so it sets the height and the photo card
 * follows. Row two is `items-start` — Account Access is a short card, and the
 * "Account Created" line sits *below* it, outside the white.
 *
 * Inner panel geometry carries over from the old frame: a grey box inset 28 with
 * 21px of its own padding, giving a 657px content strip. The name row is
 * 197 / 297 / 97 on 33px gaps; the three-up row is three 197s on the same gap;
 * the password pair is two 312s. Department measures 520 — deliberately short of
 * the strip, not a full-width field.
 *
 * Personal Details is display only (see PROFILES). The only live controls are
 * the photo buttons and the password form, and neither is wired: phase 3a is
 * static UI, so Change Password posts nowhere until Supabase Auth lands.
 */
export default async function ProfilePage() {
  const user = await getCurrentUser();
  const profile = PROFILES[user.role as keyof typeof PROFILES] ?? PROFILES.qac_personnel;

  return (
    <div className="px-[81px] pt-[19px] pb-[16px]">
      <div className="flex items-stretch gap-[15px]">
        <Card className="flex w-[260px] shrink-0 flex-col px-[43px] pt-[19px] pb-[12px]">
          <SectionHeading icon={CircleUserRound}>PROFILE</SectionHeading>

          <div className="relative mt-[18px] self-center">
            <Image
              src={user.avatar}
              alt=""
              width={150}
              height={150}
              className="h-[150px] w-[150px] rounded-full border-[3px] border-maroon object-cover shadow-card"
            />
            <button
              type="button"
              aria-label="Change profile photo"
              className="absolute bottom-[6px] right-[6px] flex h-[32px] w-[32px] items-center justify-center rounded-full bg-white text-maroon shadow-card"
            >
              <SquarePen className="h-[17px] w-[17px]" strokeWidth={2} aria-hidden />
            </button>
          </div>

          {/* `md`, not `lg`: the card's measured 43px padding leaves a 174px
              button, and "Upload New Photo" at 15px wraps inside it. The frame's
              label measures ~13px, which is not a token — 12 is, and it fits. */}
          <Button variant="solid" size="md" icon={Upload} className="mt-[34px] w-full">
            Upload New Photo
          </Button>
          <Button variant="yellow" size="md" icon={Trash2} className="mt-[8px] w-full">
            Remove Photo
          </Button>
          <p className="mt-[9px] text-center text-regular italic leading-none text-gray">
            Accepted format: JPG, PNG
          </p>
        </Card>

        <Card className="min-w-0 flex-1 px-[28px] pt-[19px] pb-[22px]">
          <SectionHeading icon={IdCard}>PERSONAL DETAILS</SectionHeading>

          <div className="mt-[13px] rounded-[14px] bg-[color:var(--color-gray)]/5 px-[21px] pt-[22px] pb-[29px]">
            <FieldLabel note="Cannot be changed">Full Name</FieldLabel>
            <div className="mt-[10px] flex gap-[33px]">
              <ReadOnlyValue
                label="Surname"
                value={profile.surname}
                className="w-[197px]"
              />
              <ReadOnlyValue
                label="Given name"
                value={profile.givenName}
                className="w-[297px]"
              />
              <ReadOnlyValue
                label="Middle initial"
                value={profile.middleInitial}
                className="w-[97px]"
              />
            </div>

            {/* Three 197s on a 33 gap. A role with no campus (QAC Personnel)
                drops to two filled columns and leaves the third empty — the
                boxes keep their width rather than stretching to share the row. */}
            <div className="mt-[16px] grid grid-cols-3 gap-x-[33px]">
              <ReadOnlyField label="System Role" value={profile.systemRole} />
              {profile.campus && <ReadOnlyField label="Campus" value={profile.campus} />}
              <ReadOnlyField label="Position" value={profile.position} />
            </div>

            <ReadOnlyField
              label={profile.wide.label}
              value={profile.wide.value}
              className="mt-[20px] w-[520px]"
            />
          </div>
        </Card>
      </div>

      <div className="mt-[22px] flex items-start gap-[15px]">
        <div className="w-[260px] shrink-0">
          <Card className="px-[24px] pt-[19px] pb-[22px]">
            <SectionHeading icon={Mail}>ACCOUNT ACCESS</SectionHeading>
            <div className="mt-[22px] rounded-[10px] bg-[color:var(--color-gray)]/5 px-[18px] py-[9px]">
              <span className="block text-regular leading-none text-gray">
                Registered Webmail
              </span>
              <span className="mt-[7px] block text-subheading leading-none text-black">
                {profile.webmail}
              </span>
            </div>
          </Card>
          <p className="mt-[10px] pl-[16px] text-regular italic leading-none text-gray">
            {profile.createdOn}
          </p>
        </div>

        <Card className="min-w-0 flex-1 px-[28px] pt-[19px] pb-[19px]">
          <SectionHeading icon={KeyRound}>CHANGE PASSWORD</SectionHeading>

          <div className="mt-[22px] rounded-[14px] bg-[color:var(--color-gray)]/5 px-[21px] pt-[17px] pb-[13px]">
            <FieldLabel>Current Password</FieldLabel>
            <div className="mt-[10px]">
              <PasswordInput label="Current password" defaultValue="password12" />
            </div>
            <p className="mt-[8px] text-regular leading-none text-gray">
              Enter your current password to verify your identity
            </p>

            <div className="mt-[20px] grid grid-cols-2 gap-x-[33px]">
              <div>
                <FieldLabel>New Password</FieldLabel>
                <div className="mt-[10px] w-[312px]">
                  <PasswordInput label="New password" defaultValue="password12" />
                </div>
                <ul className="mt-[8px] list-disc pl-[20px] text-regular italic leading-[1.5] text-gray">
                  <li>Must be at least 8 characters long</li>
                  <li>Must contain one or more numbers</li>
                </ul>
              </div>
              <div>
                <FieldLabel>Confirm New Password</FieldLabel>
                <div className="mt-[10px] w-[312px]">
                  <PasswordInput label="Confirm new password" defaultValue="password12" />
                </div>
                <p className="mt-[8px] text-regular italic leading-[1.5] text-gray">
                  Must match new password
                </p>
              </div>
            </div>
          </div>

          <div className="mt-[20px] flex justify-end gap-[9px]">
            <Button variant="outline" size="lg">
              Reset
            </Button>
            <Button variant="solid" size="lg">
              Change Password
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
