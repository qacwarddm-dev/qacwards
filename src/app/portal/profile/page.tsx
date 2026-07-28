import { Mail, SquarePen, User } from "lucide-react";
import Image from "next/image";
import { PROFILES } from "@/components/portal/data";
import { getCurrentUser } from "@/lib/current-user";
import {
  Button,
  Card,
  FieldLabel,
  PasswordInput,
  SectionHeading,
  SelectInput,
  TextInput,
} from "@/components/portal/kit";

/**
 * Profile — one screen for every role. qac_personnel/06-Profile.png and
 * program_representative/09-Profile.png measure identically card for card
 * (header 1028x262 at y78, then 260 / 15 / 753 at y355), so the role only
 * changes content: a Campus select beside Position, and the header subtitle.
 *
 * Panel geometry: inner box inset 27/28 with 21px of its own padding, giving a
 * 657px content strip. Two columns of 312 on a 345 pitch; the name row is
 * 197 / 297 / 97 with 33px gaps; password inputs are 247 inside their column.
 */
export default async function ProfilePage() {
  const user = await getCurrentUser();
  const profile = PROFILES[user.role as keyof typeof PROFILES] ?? PROFILES.qac_personnel;

  return (
    <div className="px-[81px] pt-[19px] pb-[16px]">
      <Card className="flex h-[259px] items-start gap-[33px] px-[61px] pt-[74px]">
        <div className="relative shrink-0">
          <Image
            src={user.avatar}
            alt=""
            width={80}
            height={80}
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

        <div className="min-w-0">
          <h1 className="text-title font-bold leading-[1.2] text-black">
            {profile.name}
          </h1>
          <p className="mt-[8px] flex items-center gap-[14px] text-subheading leading-none">
            <span className="text-black">{profile.position}</span>
            <span className="text-[color:var(--color-gray)]/60">|</span>
            <span className="italic text-gray">{profile.affiliation}</span>
          </p>
        </div>
      </Card>

      <div className="mt-[15px] flex items-start gap-[15px]">
        <Card className="w-[260px] shrink-0 px-[24px] pb-[26px] pt-[19px]">
          <SectionHeading icon={Mail}>ACCOUNT ACCESS</SectionHeading>
          <div className="mt-[16px] rounded-[10px] bg-[color:var(--color-gray)]/5 px-[18px] py-[16px]">
            <span className="block text-regular leading-none text-gray">
              Registered Webmail
            </span>
            <span className="mt-[12px] block text-subheading leading-none text-black">
              {profile.webmail}
            </span>
          </div>
          <p className="mt-[18px] text-regular italic leading-none text-gray">
            {profile.createdOn}
          </p>
        </Card>

        <Card className="min-w-0 flex-1 px-[28px] pb-[25px] pt-[19px]">
          <SectionHeading icon={User}>PERSONAL DETAILS</SectionHeading>

          <div className="mt-[13px] rounded-[14px] bg-[color:var(--color-gray)]/5 px-[21px] pt-[20px] pb-[24px]">
            <FieldLabel>Full Name</FieldLabel>
            <div className="mt-[10px] flex gap-[33px]">
              <TextInput label="Surname" placeholder="Surname" className="w-[197px]" />
              <TextInput label="Given name" placeholder="Given Name" className="w-[297px]" />
              <TextInput label="Middle initial" placeholder="M.I." className="w-[97px]" />
            </div>

            {profile.disciplineExpertise ? (
              <div className="mt-[16px]">
                <FieldLabel>Discipline Expertise</FieldLabel>
                <div className="mt-[10px]">
                  <SelectInput
                    label="Discipline Expertise"
                    value={profile.disciplineExpertise}
                    active
                  />
                </div>
              </div>
            ) : (
              <div className="mt-[16px] grid grid-cols-2 gap-x-[33px]">
                {profile.campuses ? (
                  <>
                    <div>
                      <FieldLabel>Campus</FieldLabel>
                      <div className="mt-[10px]">
                        <SelectInput label="Campus" options={profile.campuses} />
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Position</FieldLabel>
                      <div className="mt-[10px]">
                        <SelectInput label="Position" options={profile.positions} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <FieldLabel>Position</FieldLabel>
                    <div className="mt-[10px]">
                      <SelectInput label="Position" options={profile.positions} />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-[16px] grid grid-cols-2 gap-x-[33px]">
              <div>
                <FieldLabel>Password</FieldLabel>
                <div className="mt-[10px] w-[247px]">
                  <PasswordInput label="Password" defaultValue="password12" />
                </div>
              </div>
              <div>
                <FieldLabel>Confirm Password</FieldLabel>
                <div className="mt-[10px] w-[247px]">
                  <PasswordInput label="Confirm password" defaultValue="password12" />
                </div>
              </div>
            </div>

            <ul className="mt-[14px] list-disc pl-[20px] text-regular italic leading-[1.5] text-gray">
              <li>Must be at least 8 characters long</li>
              <li>Must contain one or more numbers</li>
            </ul>

            <div className="mt-[18px] flex justify-end">
              <Button variant="solid" className="h-[38px] px-[26px] text-subheading">
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
