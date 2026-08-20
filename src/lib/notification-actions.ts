"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * The only two writes a user makes to their own bell.
 *
 * Neither passes a recipient. RLS restricts the UPDATE to `recipient_id =
 * auth.uid()`, and the `freeze_notification_columns` trigger restricts it to
 * `read_at` — so "mark as read" cannot become "rewrite the link on a
 * notification the system sent me", which the row-level policy alone would
 * have allowed.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function markNotificationRead(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal", "layout");
  return { ok: true };
}

/** "Read All (n)" in the dropdown header. */
export async function markAllNotificationsRead(): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal", "layout");
  return { ok: true };
}
