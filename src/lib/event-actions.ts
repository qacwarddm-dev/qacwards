"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/database.types";
import { getMonthEvents, manilaWallClockToUtcIso } from "@/lib/events";

/** Writes behind the events calendar. QAC only, enforced by RLS. */
export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * `MonthCalendar` manages its own Prev/Next cursor client-side and only ever
 * holds one month's `marks`/`events` at a time — there is no lookahead cache.
 * This is the server action `EventsCalendar` calls on `onMonthChange` so
 * paging the grid re-reads real data instead of freezing on the month the
 * page first loaded with.
 */
export async function fetchMonthEvents(year: number, month: number) {
  return getMonthEvents(year, month);
}

export async function createEvent(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  const kind = String(formData.get("kind") ?? "meeting");
  const roles = formData.getAll("roles").map(String) as UserRole[];

  if (!title || !startTime) {
    return { ok: false, error: "A title and a start time are required." };
  }

  // BUG-7: the event row and its audience rows used to be two separate
  // PostgREST calls — two transactions — which broke the whole point of
  // `notify_event_scheduled` being a deferred constraint trigger (D-24): it
  // fired at the first transaction's commit, before any audience row existed,
  // which B7 defines as university-wide. `create_event` does both inserts in
  // one statement so the trigger sees the final audience. No rows means
  // university-wide, which the read policy treats as visible to everyone — so
  // an empty selection is a real choice, not a mistake.
  const { error } = await supabase.rpc("create_event", {
    p_title: title,
    // datetime-local gives a wall-clock string with no zone — treat it as
    // Manila (O-20) instead of trusting the server process's own zone.
    p_start_time: manilaWallClockToUtcIso(startTime),
    ...(description ? { p_description: description } : {}),
    ...(endTime ? { p_end_time: manilaWallClockToUtcIso(endTime) } : {}),
    p_kind: kind as "meeting" | "survey_visit" | "deadline" | "holiday" | "other",
    ...(roles.length > 0 ? { p_roles: roles } : {}),
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/events");
  return { ok: true };
}

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
