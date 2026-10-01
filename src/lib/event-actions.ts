"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

import {  manilaWallClockToUtcIso } from "@/lib/events";

/** Writes behind the events calendar. QAC only, enforced by RLS. */
export type ActionResult = { ok: true } | { ok: false; error: string };

/** Cancelled, not deleted — people planned around it, so it stays on the
 *  calendar struck through. There is no delete policy on `events`. */
export async function cancelEvent(eventId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("events")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/events");
  return { ok: true };
}

const CAL_KIND = { dead: "deadline", visit: "survey_visit", meet: "meeting", hol: "holiday" } as const;

function parseClock(s: string | undefined): string | null {
  const m = s?.match(/(\d{1,2}):(\d{2})\s*(AM|PM|NN)/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  if (/nn/i.test(m[3])) h = 12;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

/** The mockup's "Add event" form: one date, a free-text time range and a location. */
export async function createPortalEvent(input: {
  title: string;
  type: keyof typeof CAL_KIND;
  programId: string | null;
  date: string;
  time: string;
  where: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const [a, b] = input.time.split(/[–-]/);
  const start = parseClock(a) ?? "08:00";
  const end = parseClock(b);
  const { data: id, error } = await supabase.rpc("create_event", {
    p_title: input.title,
    p_start_time: manilaWallClockToUtcIso(`${input.date}T${start}`),
    ...(end ? { p_end_time: manilaWallClockToUtcIso(`${input.date}T${end}`) } : {}),
    ...(input.where.trim() ? { p_description: input.where.trim() } : {}),
    p_kind: CAL_KIND[input.type],
  });
  if (error) return { ok: false, error: error.message };
  if (input.programId && id) {
    const { error: linkError } = await supabase.from("event_programs").insert({ event_id: id, program_id: input.programId });
    if (linkError) return { ok: false, error: linkError.message };
  }
  revalidatePath("/portal/events");
  revalidatePath("/portal/dashboard");
  return { ok: true };
}
