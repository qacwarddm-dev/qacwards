"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";

export type ActionResult = { ok: true } | { ok: false; error: string };

type SelfEvent =
  | "password_changed"
  | "photo_changed"
  | "photo_removed"
  | "signature_saved"
  | "signature_uploaded"
  | "contact_updated"
  | "notif_prefs_updated";

/** Photo and signature writes are already audited by the profiles trigger; only
 *  events with no table behind them are logged here. */
export async function logSelfActivity(kind: SelfEvent, detail?: string) {
  if (!["password_changed", "contact_updated", "notif_prefs_updated"].includes(kind)) return;
  const supabase = await createClient();
  await supabase.rpc("log_self_event" as never, { p_kind: kind, p_detail: detail ?? null } as never);
}

export async function saveContactDetails(mobile: string, localNo: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!/^09\d{9}$/.test(mobile.replace(/\D/g, ""))) return { ok: false, error: "Enter an 11-digit mobile number, e.g. 0917 555 0142" };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ mobile, local_no: localNo || null }).eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  await logSelfActivity("contact_updated");
  revalidatePath("/portal/profile");
  return { ok: true };
}

export async function saveNotificationPrefs(prefs: Record<string, [number, number]>): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ notif_prefs: prefs }).eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  await logSelfActivity("notif_prefs_updated");
  return { ok: true };
}
