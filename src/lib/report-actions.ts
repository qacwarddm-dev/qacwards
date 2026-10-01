"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { RTYPES, isReportType, reportScope, type ReportFilters } from "@/lib/report-model";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function qac() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "qac_personnel" && user.role !== "qac_admin")) return null;
  return user;
}

export async function saveReport(type: string, filters: ReportFilters): Promise<ActionResult> {
  const user = await qac();
  if (!user) return { ok: false, error: "Only QAC can save reports." };
  if (!isReportType(type)) return { ok: false, error: "Unknown report type." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(filters.asOf)) return { ok: false, error: "Pick an as-of date." };
  const supabase = await createClient();
  const { error } = await supabase.from("saved_reports").insert({
    type,
    title: `${RTYPES[type][0]} Report`,
    scope: reportScope(filters),
    filters,
    created_by: user.id,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal/reports");
  return { ok: true };
}

export async function deleteReport(id: string): Promise<ActionResult> {
  if (!(await qac())) return { ok: false, error: "Only QAC can delete reports." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("saved_reports").delete().eq("id", id).select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "That report could not be deleted." };
  revalidatePath("/portal/reports");
  return { ok: true };
}
