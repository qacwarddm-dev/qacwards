"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { BUCKETS, checkUploaded, removeFile } from "@/lib/storage";

export type ActionResult = { ok: true } | { ok: false; error: string };

const MAX_BYTES = 25 * 1024 * 1024;

function refresh() {
  for (const p of ["/portal/aaccup-copc", "/portal/documents", "/portal/reports", "/portal/dashboard"]) revalidatePath(p);
}

async function qac() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "qac_personnel" && user.role !== "qac_admin")) return null;
  return user;
}

export async function uploadCopcFile(formData: FormData): Promise<ActionResult> {
  const user = await qac();
  if (!user) return { ok: false, error: "Only QAC can upload here." };
  const supabase = await createClient();

  const programId = String(formData.get("programId") ?? "");
  const folderId = String(formData.get("folderId") ?? "");
  const unitId = String(formData.get("unitId") ?? "") || null;
  const from = String(formData.get("from") ?? "") || null;
  const to = String(formData.get("to") ?? "") || null;
  const status = String(formData.get("status") ?? "").trim() || null;
  const levelCode = String(formData.get("level") ?? "") || null;
  const path = String(formData.get("path") ?? "");
  const fileName = String(formData.get("fileName") ?? "");

  if (!programId || !folderId) return { ok: false, error: "Choose a program." };
  const stored = await checkUploaded(supabase, BUCKETS.repository, { path, prefix: `${programId}/${folderId}/`, name: fileName, exts: [".pdf"], max: MAX_BYTES });
  if ("error" in stored) return { ok: false, error: stored.error };
  if (from && to && to < from) return { ok: false, error: "Valid until must be after valid from." };

  let levelId: string | null = null;
  if (levelCode) {
    const { data } = await supabase.from("accreditation_levels").select("id").eq("code", levelCode).maybeSingle();
    levelId = data?.id ?? null;
  }

  const { error } = await supabase.from("repository_files").insert({
    program_id: programId,
    folder_id: folderId,
    unit_id: unitId,
    title: fileName,
    storage_path: path,
    file_size: stored.size,
    uploaded_by: user.id,
    valid_from: from,
    valid_until: to,
    cert_status: status,
    level_id: levelId,
  });
  if (error) {
    await supabase.storage.from(BUCKETS.repository).remove([path]);
    return { ok: false, error: error.message };
  }

  const { data: reps } = await supabase.from("program_reps").select("profile_id").eq("program_id", programId);
  await Promise.all(
    (reps ?? []).map((r) => supabase.rpc("send_reminder", { p_profile: r.profile_id, p_title: `New file in AACCUP & COPC: ${fileName}`, p_link: "/portal/documents?tab=reports" })),
  );
  refresh();
  return { ok: true };
}

export async function renameCopcFile(id: string, raw: string): Promise<ActionResult> {
  if (!(await qac())) return { ok: false, error: "Only QAC can rename files." };
  const base = raw.trim().replace(/\s+/g, " ").replace(/\.pdf$/i, "");
  if (!base || base.length > 150) return { ok: false, error: "Enter a name" };
  const supabase = await createClient();
  const { data, error } = await supabase.from("repository_files").update({ title: `${base}.pdf` }).eq("id", id).select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "That file could not be renamed." };
  refresh();
  return { ok: true };
}

export async function deleteCopcFile(id: string): Promise<ActionResult> {
  if (!(await qac())) return { ok: false, error: "Only QAC can delete files." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("repository_files").update({ is_archived: true, archived_at: new Date().toISOString() }).eq("id", id).select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "That file could not be deleted." };
  refresh();
  return { ok: true };
}

export async function restoreCopcFile(id: string): Promise<ActionResult> {
  if (!(await qac())) return { ok: false, error: "Only QAC can restore files." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("repository_files").update({ is_archived: false, archived_at: null }).eq("id", id).eq("is_archived", true).select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "That file could not be restored." };
  refresh();
  return { ok: true };
}

export async function purgeCopcFile(id: string): Promise<ActionResult> {
  if (!(await qac())) return { ok: false, error: "Only QAC can delete files." };
  const supabase = await createClient();
  const { data: file } = await supabase.from("repository_files").select("storage_path").eq("id", id).eq("is_archived", true).maybeSingle();
  if (!file) return { ok: false, error: "That file is no longer in Recently Deleted." };
  const { error } = await supabase.from("repository_files").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await removeFile(supabase, BUCKETS.repository, file.storage_path);
  refresh();
  revalidatePath("/portal/recently-deleted");
  return { ok: true };
}

export async function createCopcFolder(loc: "main" | "camp", raw: string): Promise<ActionResult> {
  const user = await qac();
  if (!user) return { ok: false, error: "Only QAC can create folders." };
  const name = raw.trim().replace(/\s+/g, " ");
  if (!name || name.length > 120) return { ok: false, error: "Enter a folder name" };
  const supabase = await createClient();
  const { error } = await supabase.from("repository_units").insert({ location: loc === "main" ? "main" : "campus", name, created_by: user.id });
  if (error) return { ok: false, error: error.code === "23505" ? "A folder with that name already exists." : error.message };
  refresh();
  return { ok: true };
}

export async function renameCopcFolder(id: string, raw: string): Promise<ActionResult> {
  if (!(await qac())) return { ok: false, error: "Only QAC can rename folders." };
  const name = raw.trim().replace(/\s+/g, " ");
  if (!name || name.length > 120) return { ok: false, error: "Enter a folder name" };
  const supabase = await createClient();
  const { data, error } = await supabase.from("repository_units").update({ name }).eq("id", id).select("id");
  if (error) return { ok: false, error: error.code === "23505" ? "A folder with that name already exists." : error.message };
  if (!data?.length) return { ok: false, error: "That folder could not be renamed." };
  refresh();
  return { ok: true };
}

export async function deleteCopcFolder(id: string): Promise<ActionResult> {
  if (!(await qac())) return { ok: false, error: "Only QAC can delete folders." };
  const supabase = await createClient();
  const { count } = await supabase.from("repository_files").select("id", { count: "exact", head: true }).eq("unit_id", id).eq("is_archived", false);
  if (count) return { ok: false, error: `This folder still has ${count} file${count > 1 ? "s" : ""}. Delete or move them first.` };
  const { data, error } = await supabase.from("repository_units").delete().eq("id", id).select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "That folder could not be deleted." };
  refresh();
  return { ok: true };
}
