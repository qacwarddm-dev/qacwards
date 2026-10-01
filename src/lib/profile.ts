import { getSetting } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABELS } from "@/lib/role-labels";
import type { PortalRole } from "@/components/portal/portal-nav";

export type ProfileView = {
  id: string;
  surname: string;
  given: string;
  middle: string;
  role: PortalRole;
  roleLabel: string;
  campus: string;
  position: string;
  college: string;
  webmail: string;
  since: string;
  mobile: string;
  localNo: string;
  notifPrefs: Record<string, [number, number]>;
  pwMin: number;
};

export async function getProfileView(): Promise<ProfileView | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, surname, given_name, middle_initial, role, webmail, created_at, mobile, local_no, notif_prefs, campuses(name), colleges(name, code), positions(name)")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;
  const sec = await getSetting(supabase, "security");
  const role = data.role as PortalRole;
  return {
    pwMin: sec.pw,
    id: data.id,
    surname: data.surname,
    given: data.given_name,
    middle: data.middle_initial ?? "",
    role,
    roleLabel: ROLE_LABELS[role],
    campus: data.campuses?.name ?? "Sta. Mesa, Manila",
    position: data.positions?.name ?? ROLE_LABELS[role],
    college: data.colleges ? `${data.colleges.name} (${data.colleges.code})` : "Quality Assurance Center",
    webmail: data.webmail,
    since: new Date(data.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "Asia/Manila" }),
    mobile: data.mobile ?? "",
    localNo: data.local_no ?? "",
    notifPrefs: (data.notif_prefs as Record<string, [number, number]>) ?? {},
  };
}
