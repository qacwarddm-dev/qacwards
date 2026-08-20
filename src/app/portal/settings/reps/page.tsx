import { UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, SectionHeading } from "@/components/portal/kit";
import RepMapper from "@/components/portal/screens/RepMapper";

/**
 * Attach representatives to programmes.
 *
 * Decision 6: a representative can hold many programmes, and the same programme
 * name on another campus is a different programme row — so the picker keys on the
 * programme id and shows its campus, never on the name alone.
 */
export default async function RepsSettingsPage() {
  const supabase = await createClient();

  const [{ data: reps }, { data: programs }, { data: mappings }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, surname, given_name, webmail")
      .eq("role", "program_representative")
      .eq("is_active", true)
      .order("surname"),
    supabase
      .from("programs")
      .select("id, name, campuses(name)")
      .order("name")
      .limit(1000),
    supabase.from("program_reps").select("profile_id, program_id"),
  ]);

  return (
    <Card className="px-[28px] pt-[19px] pb-[22px]">
      <SectionHeading icon={UsersRound}>PROGRAM REPRESENTATIVES</SectionHeading>
      <RepMapper
        reps={(reps ?? []).map((r) => ({
          id: r.id,
          name: `${r.surname}, ${r.given_name}`,
          webmail: r.webmail,
        }))}
        programs={(programs ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          campus: p.campuses?.name ?? "—",
        }))}
        mappings={mappings ?? []}
      />
    </Card>
  );
}
