import type { createClient } from "@/lib/supabase/server";
import { manilaDay, shortDate } from "@/lib/program-names";

type Db = Awaited<ReturnType<typeof createClient>>;

export type CycleWindow = { status: string; end_date: string };

export const acceptsWork = (c: CycleWindow | null | undefined, today = manilaDay()) => Boolean(c && c.status === "open" && c.end_date >= today);

export function cycleClosedMessage(c: CycleWindow | null | undefined) {
  if (c?.status === "open") return `The accreditation cycle ended on ${shortDate(c.end_date)}. Submissions are closed.`;
  return "This accreditation cycle is closed. Its documents are read-only.";
}

export async function submissionWindow(supabase: Db, submissionId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data } = await supabase.from("submissions").select("accreditation_cycles(status, end_date)").eq("id", submissionId).maybeSingle();
  const c = data?.accreditation_cycles;
  if (c && !acceptsWork(c)) return { ok: false, error: cycleClosedMessage(c) };
  return { ok: true };
}

export async function openWindow(supabase: Db): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { data } = await supabase.from("accreditation_cycles").select("id, status, end_date").eq("status", "open").maybeSingle();
  if (!data) return { ok: false, error: "No accreditation cycle is open yet." };
  if (!acceptsWork(data)) return { ok: false, error: cycleClosedMessage(data) };
  return { ok: true, id: data.id };
}
