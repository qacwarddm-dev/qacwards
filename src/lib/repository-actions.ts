"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { BUCKETS, uploadFile } from "@/lib/storage";

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
  const file = formData.get("file");

  if (!programId || !folderId) return { ok: false, error: "Choose a program." };
  if (!(file instanceof File) || !file.size) return { ok: false, error: "Choose a PDF to upload." };
  if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) return { ok: false, error: "PDF files only" };
  if (file.size > MAX_BYTES) return { ok: false, error: "The file is over 25 MB." };
  if (from && to && to < from) return { ok: false, error: "Valid until must be after valid from." };

  let levelId: string | null = null;
  if (levelCode) {
    const { data } = await supabase.from("accreditation_levels").select("id").eq("code", levelCode).maybeSingle();
    levelId = data?.id ?? null;
  }

  const docUuid = crypto.randomUUID();
  const path = `${programId}/${folderId}/${docUuid}.pdf`;
  const stored = await uploadFile(supabase, BUCKETS.repository, path, file, { contentType: "application/pdf" });
  if (stored.error) return { ok: false, error: stored.error };

  const { error } = await supabase.from("repository_files").insert({
    program_id: programId,
    folder_id: folderId,
    unit_id: unitId,
    title: file.name,
    storage_path: path,
    file_size: file.size,
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
    (reps ?? []).map((r) => supabase.rpc("send_reminder", { p_profile: r.profile_id, p_title: `New file in AACCUP & COPC: ${file.name}`, p_link: "/portal/documents?tab=reports" })),
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
