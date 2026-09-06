import Link from "next/link";
import { History, IdCard, Mail } from "lucide-react";
import { requireCurrentUser } from "@/lib/current-user";
import { getProfileDetails } from "@/lib/profile";
import { getExpertiseAreas, getExpertiseFor, getSignatureUrl } from "@/lib/accreditor";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS, signedUrl } from "@/lib/storage";
import ProfilePasswordCard from "@/components/portal/screens/ProfilePasswordCard";
import ProfilePhotoCard from "@/components/portal/screens/ProfilePhotoCard";
import ProfileSignatureCard from "@/components/portal/screens/ProfileSignatureCard";
import ProfileSpecialtyCard from "@/components/portal/screens/ProfileSpecialtyCard";
import {
  Card,
  FieldLabel,
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
 * Wired in B2. Personal Details is still display-only; the live panels are
 * their own client components because they own mutations, and the page stays a
 * server component that reads and passes down.
 *
 * Round 2 §3/§4 add a third row for accreditors only — editable Discipline
 * Expertise beside the e-signature. Both are things an accreditor owns about
 * themselves, and neither means anything for a representative, so the row is
 * absent rather than empty for everyone else. That also takes Discipline
 * Expertise out of the read-only Personal Details panel for them: one field,
 * one place, and the editable one wins.
 */
const AVATAR_FALLBACK = "/assets/portal/avatar-placeholder.png";

export default async function ProfilePage() {
  const user = await requireCurrentUser();
  const profile = await getProfileDetails();

  const [expertiseAreas, myExpertise, signatureUrl] = user.actsAsAccreditor
    ? await Promise.all([
        getExpertiseAreas(),
        getExpertiseFor(user.id),
        getSignatureUrl(user.id, user.signaturePath),
      ])
    : [[], [], null];

  // The avatars bucket is private, so the disc needs a signed URL rather than the
  // stored path — §2.8: no bucket in this system serves a public URL.
  let avatarUrl = AVATAR_FALLBACK;
  if (user.avatarPath) {
    const supabase = await createClient();
    const signed = await signedUrl(supabase, BUCKETS.avatars, user.avatarPath);
    if (signed.data) avatarUrl = signed.data;
  }

  if (!profile) {
    return (
      <div className="px-[81px] pt-[19px] pb-[16px]">
        <h1 className="sr-only">Profile</h1>
        <Card className="px-[28px] py-[22px]">
          <p className="text-subheading text-gray">
            We could not load your profile. Try signing in again.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-[81px] pt-[19px] pb-[16px]">
      <h1 className="sr-only">Profile</h1>
      <div className="flex items-stretch gap-[15px]">
        <ProfilePhotoCard
          profileId={user.id}
          avatarUrl={avatarUrl}
          hasAvatar={Boolean(user.avatarPath)}
        />

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

            {!user.actsAsAccreditor && (
              <ReadOnlyField
                label={profile.wide.label}
                value={profile.wide.value}
                className="mt-[20px] w-[520px]"
              />
            )}
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

          {/* Decision 17 gives every role their own audit trail, but only the
              QAC Admin rail can carry a new nav item without contradicting a
              traced frame (portal-nav.ts). This is how the other three reach
              it — under Account Access, which is where a person's own record
              of what they did belongs. */}
          <Link
            href="/portal/activity"
            className="mt-[14px] flex items-center gap-[8px] pl-[16px] text-regular font-semibold leading-none text-maroon transition-opacity hover:opacity-70"
          >
            <History className="h-[14px] w-[14px]" strokeWidth={2} />
            View my activity
          </Link>
        </div>

        <ProfilePasswordCard webmail={profile.webmail} />
      </div>

      {user.actsAsAccreditor && (
        <div className="mt-[22px] flex flex-col items-stretch gap-[15px] lg:flex-row">
          <ProfileSpecialtyCard
            profileId={user.id}
            areas={expertiseAreas}
            initial={myExpertise}
          />
          <ProfileSignatureCard signatureUrl={signatureUrl} suggestedName={user.name} />
        </div>
      )}
    </div>
  );
}
