import { createClient } from "@/lib/supabase/server";
import { ROLE_LABELS } from "@/lib/current-user";
import type { PortalRole } from "@/components/portal/portal-nav";

/**
 * The full identity the Profile screen prints, as opposed to the three fields the
 * top bar needs. Kept apart from `getCurrentUser()` deliberately: every portal
 * request resolves the user, and only one screen needs the campus, the college
 * and the expertise list, so those joins do not belong in the hot path.
 *
 * Shape mirrors `PortalProfile` in `data.ts` — the constant this replaces — so
 * the screen's markup did not have to change.
 */
export type ProfileDetails = {
  surname: string;
  givenName: string;
  middleInitial: string;
  systemRole: string;
  campus?: string;
  position: string;
  /** Department for campus roles, Discipline Expertise for an accreditor: same
   *  slot, own label, so the panel needs no per-role branch. */
  wide: { label: string; value: string };
  webmail: string;
  createdOn: string;
};

/** "Account Created on May 2026", in Asia/Manila — §8.4: display is Manila, storage
 *  is timestamptz, and the two must not be confused. */
function createdOn(iso: string): string {
  const when = new Date(iso).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
  return `Account Created on ${when}`;
}

export async function getProfileDetails(): Promise<ProfileDetails | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select(
      `surname, given_name, middle_initial, role, webmail, created_at,
       campuses(name), colleges(name, code), positions(name),
       accreditor_expertise(expertise_areas(name))`,
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!data) return null;

  const role = data.role as PortalRole;
  const expertise = (data.accreditor_expertise ?? [])
    .map((row) => row.expertise_areas?.name)
    .filter((name): name is string => Boolean(name));

  // An accreditor is defined by what they can evaluate, everyone else by where
  // they sit — same slot on the screen, different question.
  const wide =
    role === "internal_accreditor"
      ? {
          label: "Discipline Expertise",
          value: expertise.length > 0 ? expertise.join(", ") : "—",
        }
      : {
          label: "Department",
          value: data.colleges
            ? `${data.colleges.name} (${data.colleges.code})`
            : "PUP Quality Assurance Center",
        };

  return {
    surname: data.surname,
    givenName: data.given_name,
    middleInitial: data.middle_initial ?? "",
    systemRole: ROLE_LABELS[role],
    campus: data.campuses?.name,
    position: data.positions?.name ?? "—",
    wide,
    webmail: data.webmail,
    createdOn: createdOn(data.created_at),
  };
}
