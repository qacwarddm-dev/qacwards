import IaProfile from "@/components/portal/screens/profile/IaProfile";
import QacProfile from "@/components/portal/screens/profile/QacProfile";
import RepProfile from "@/components/portal/screens/profile/RepProfile";
import { getExpertiseAreas, getExpertiseFor, getSignatureUrl } from "@/lib/accreditor";
import { requireCurrentUser } from "@/lib/current-user";
import { getProfileView } from "@/lib/profile";
import { initialsOf, shortDate } from "@/lib/program-names";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const REVIEW_TABLES = ["document_reviews", "accreditor_reports", "evaluation_items", "ndas"];
const SETTINGS_TABLES = ["site_settings", "accreditation_cycles", "system_backups", "program_reps", "programs", "announcements"];

const weekAgo = () => new Date(Date.now() - 7 * 864e5).toISOString();

export default async function ProfilePage() {
  const user = await requireCurrentUser();
  const p = await getProfileView();
  if (!p) redirect("/login");
  const initials = initialsOf(user.name);
  const avatarUrl = user.avatarPath ? user.avatar : null;

  if (user.role === "program_representative") return <RepProfile p={p} initials={initials} avatarUrl={avatarUrl} />;

  if (user.role === "internal_accreditor") {
    const [areas, mine, signatureUrl] = await Promise.all([getExpertiseAreas(), getExpertiseFor(user.id), getSignatureUrl(user.id, user.signaturePath)]);
    return <IaProfile p={p} initials={initials} avatarUrl={avatarUrl} areas={areas} mine={mine} signatureUrl={signatureUrl} />;
  }

  const supabase = await createClient();
  const since = weekAgo();
  const count = async (tables?: string[]) => {
    let q = supabase.from("activity_logs").select("id", { count: "exact", head: true }).eq("actor_id", user.id).gte("created_at", since);
    if (tables) q = q.in("target_table", tables);
    const { count: n } = await q;
    return n ?? 0;
  };
  const [primary, week, signatureUrl, sigRow] = await Promise.all([
    count(user.role === "qac_admin" ? SETTINGS_TABLES : REVIEW_TABLES),
    count(),
    getSignatureUrl(user.id, user.signaturePath),
    supabase.from("activity_logs").select("created_at").eq("actor_id", user.id).eq("target_table", "profiles").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return (
    <QacProfile
      p={p}
      initials={initials}
      avatarUrl={avatarUrl}
      signatureUrl={signatureUrl}
      signatureSaved={user.signaturePath && sigRow.data ? shortDate(sigRow.data.created_at) : null}
      stats={{ primary, week }}
    />
  );
}
