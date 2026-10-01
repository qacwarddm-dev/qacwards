import { IaActivity, QacActivity, RepActivity } from "@/components/portal/screens/MyActivity";
import { getActivityEntries } from "@/lib/activity";
import { requireCurrentUser } from "@/lib/current-user";
import { manilaDay } from "@/lib/program-names";
import { createClient } from "@/lib/supabase/server";

export default async function MyActivityPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const user = await requireCurrentUser();
  const { f } = await searchParams;
  const entries = await getActivityEntries({ actorId: user.id, role: user.role });
  const today = manilaDay();
  if (user.role === "internal_accreditor") return <IaActivity entries={entries} today={today} />;
  if (user.role === "program_representative") return <RepActivity entries={entries} initial={f} />;
  const supabase = await createClient();
  const {
    data: { user: auth },
  } = await supabase.auth.getUser();
  const at = auth?.last_sign_in_at;
  const lastSignIn = at
    ? `${manilaDay(at) === today ? "Today" : manilaDay(at)} · ${new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit" }).format(new Date(at))}`
    : "— · —";
  return <QacActivity entries={entries} today={today} admin={user.role === "qac_admin"} lastSignIn={lastSignIn} />;
}
