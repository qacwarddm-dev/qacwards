import { redirect } from "next/navigation";
import { IaHelp, RepHelp } from "@/components/portal/screens/HelpGuide";
import { requireCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";

export default async function HelpPage() {
  const user = await requireCurrentUser();
  if (user.role === "internal_accreditor") return <IaHelp />;
  if (user.role !== "program_representative") redirect("/portal/dashboard");
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "public").maybeSingle();
  const email = ((data?.value as { email?: string } | null)?.email) ?? "qac@pup.edu.ph";
  return <RepHelp email={email} />;
}
