import { CalendarRange, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, SectionHeading } from "@/components/portal/kit";
import CycleManager from "@/components/portal/screens/CycleManager";
import EmailQueuePanel from "@/components/portal/screens/EmailQueuePanel";

/**
 * Accreditation cycles — the institutional windows everything else hangs off
 * (decision 11/19). Opening one is what lets representatives file into it;
 * closing one freezes its work in place, read-only (O-14).
 */
export default async function CyclesSettingsPage() {
  const supabase = await createClient();

  const { data: cycles } = await supabase
    .from("accreditation_cycles")
    .select("id, name, description, start_date, end_date, status")
    .order("start_date", { ascending: false });

  const { count: pendingEmailCount } = await supabase
    .from("email_outbox")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <>
      <Card className="px-[28px] pt-[19px] pb-[22px]">
        <SectionHeading icon={CalendarRange}>ACCREDITATION CYCLES</SectionHeading>

        <CycleManager cycles={cycles ?? []} />

        {(!cycles || cycles.length === 0) && (
          <EmptyState message="No accreditation cycles yet." />
        )}
      </Card>

      <Card className="mt-[18px] px-[28px] pt-[19px] pb-[22px]">
        <SectionHeading icon={Mail}>EMAIL QUEUE</SectionHeading>
        <EmailQueuePanel pendingCount={pendingEmailCount ?? 0} />
      </Card>
    </>
  );
}
