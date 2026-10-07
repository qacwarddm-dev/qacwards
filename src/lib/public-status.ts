import { createClient } from "@/lib/supabase/server";
import { manilaDay } from "@/lib/program-names";

const LEVELS = [
  { code: "IV", label: "Level IV" },
  { code: "III", label: "Level III" },
  { code: "II", label: "Level II" },
  { code: "I", label: "Level I" },
  { code: "PSV", label: "Candidate" },
];

export type PublicStatus = {
  levels: { label: string; count: number }[];
  total: number;
  asOf: string;
};

export async function getPublicAccreditationStatus(): Promise<PublicStatus | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_accreditation_status");
  if (error) return null;

  const counts = new Map(data.map((r) => [r.level_code, r.programs]));
  const levels = LEVELS.map((l) => ({ label: l.label, count: counts.get(l.code) ?? 0 }));
  const asOf = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", month: "long", year: "numeric" }).format(new Date(`${manilaDay()}T12:00:00+08:00`));
  return { levels, total: levels.reduce((sum, l) => sum + l.count, 0), asOf: `As of ${asOf}` };
}
