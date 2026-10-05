import IaAccreditation, { type IaView } from "@/components/portal/screens/ia/IaAccreditation";
import { requireCurrentUser } from "@/lib/current-user";
import { getIaAssignments } from "@/lib/ia-portal";
import { LEVEL_SHORT } from "@/lib/program-names";
import { createClient } from "@/lib/supabase/server";

export default async function EvaluationPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; lv?: string; ar?: string }>;
}) {
  const user = await requireCurrentUser();
  const sp = await searchParams;
  const supabase = await createClient();
  const [all, { data: levels }] = await Promise.all([
    getIaAssignments(user.id),
    supabase.from("accreditation_levels").select("code, name").order("ordinal"),
  ]);
  const assignments = all.filter((a) => a.myResponse === "accepted");
  const selected = sp.a ? (assignments.find((a) => a.id === sp.a) ?? null) : null;
  const view: IaView = {
    lv: sp.lv,
    ar: sp.ar,
  };
  return (
    <IaAccreditation
      assignments={assignments}
      selected={selected}
      view={view}
      levels={(levels ?? []).map((l) => ({ code: l.code, name: l.name, short: LEVEL_SHORT[l.code] ?? l.code }))}
      meId={user.id}
    />
  );
}
