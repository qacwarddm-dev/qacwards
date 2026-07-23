import { Mail, SquarePen, User } from "lucide-react";
import Image from "next/image";
import { CURRENT_USER } from "@/components/portal/portal-nav";
import { PROFILE } from "@/components/portal/data";
import {
  Button,
  Card,
  FieldLabel,
  PasswordInput,
  SectionHeading,
  SelectInput,
  TextInput,
} from "@/components/portal/kit";

/** assets/FIGMA/qac_personnel/06-Profile.png */
export default function ProfilePage() {
  return (
    <div className="px-[81px] pt-[19px] pb-[45px]">
      <Card className="flex items-center gap-[33px] px-[61px] py-[53px]">
        <div className="relative shrink-0">
          <Image
            src={CURRENT_USER.avatar}
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
            {PROFILE.name}
          </h1>
          <p className="mt-[8px] flex items-center gap-[14px] text-subheading leading-none">
            <span className="text-black">{PROFILE.position}</span>
            <span className="text-[color:var(--color-gray)]/60">|</span>
            <span className="italic text-gray">{PROFILE.office}</span>
          </p>
        </div>
      </Card>

      <div className="mt-[17px] flex items-start gap-[22px]">
        <Card className="w-[360px] shrink-0 px-[30px] pb-[26px] pt-[26px]">
          <SectionHeading icon={Mail}>ACCOUNT ACCESS</SectionHeading>
          <div className="mt-[26px] rounded-[10px] bg-[color:var(--color-gray)]/10 px-[18px] py-[16px]">
            <span className="block text-regular leading-none text-gray">
              Registered Webmail
            </span>
            <span className="mt-[12px] block text-subheading leading-none text-black">
              {PROFILE.webmail}
            </span>
          </div>
          <p className="mt-[18px] text-regular italic leading-none text-gray">
            {PROFILE.createdOn}
          </p>
        </Card>

        <Card className="min-w-0 flex-1 px-[32px] pb-[26px] pt-[26px]">
          <SectionHeading icon={User}>PERSONAL DETAILS</SectionHeading>

          <div className="mt-[20px] rounded-[14px] bg-[color:var(--color-gray)]/10 px-[26px] pb-[24px] pt-[22px]">
            <FieldLabel>Full Name</FieldLabel>
            <div className="mt-[10px] flex gap-[22px]">
              <TextInput label="Surname" placeholder="Surname" className="flex-1" />
              <TextInput label="Given name" placeholder="Given Name" className="flex-1" />
              <span className="w-[100px] shrink-0">
                <TextInput label="Middle initial" placeholder="M.I." />
              </span>
            </div>

            <div className="mt-[18px]">
              <FieldLabel>Position</FieldLabel>
              <div className="mt-[10px] w-[435px]">
                <SelectInput label="Position" options={PROFILE.positions} />
              </div>
            </div>

            <div className="mt-[18px] flex gap-[22px]">
              <div className="flex-1">
                <FieldLabel>Password</FieldLabel>
                <div className="mt-[10px]">
                  <PasswordInput label="Password" defaultValue="password12" />
                </div>
              </div>
              <div className="flex-1">
                <FieldLabel>Confirm Password</FieldLabel>
                <div className="mt-[10px]">
                  <PasswordInput label="Confirm password" defaultValue="password12" />
                </div>
              </div>
            </div>

            <ul className="mt-[14px] list-disc pl-[20px] text-regular italic leading-[1.5] text-gray">
              <li>Must be at least 8 characters long</li>
              <li>Must contain one or more numbers</li>
            </ul>

            <div className="mt-[22px] flex justify-end">
              <Button variant="solid" className="h-[44px] px-[26px] text-subheading">
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
