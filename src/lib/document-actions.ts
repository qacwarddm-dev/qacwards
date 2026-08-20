"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS, uploadFile } from "@/lib/storage";

/**
 * Writes behind the document families.
 *
 * Decision 13 — the NDA is per user and **auto-unlocks on upload**. There is no
 * approval step and no `approved` column: the existence of the row is the gate,
 * because the owner ruled the undertaking is the upload itself. That makes
 * `uploadNda` the whole of the unlock.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function uploadNda(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Choose a signed NDA to upload." };
  if (file.type !== "application/pdf") return { ok: false, error: "The NDA must be a PDF." };

  // Keyed by profile id, which is what the storage policy compares against — a
  // user can only ever write into their own folder.
  const path = `${user.id}/nda.pdf`;

  const stored = await uploadFile(
    supabase,
    BUCKETS.ndas,
    path,
    file,
    { contentType: "application/pdf", upsert: true },
  );
  if (stored.error) return { ok: false, error: stored.error };

  const { error } = await supabase
    .from("ndas")
    .upsert({ profile_id: user.id, storage_path: path });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/documents");
  return { ok: true };
}

/**
 * Add a file to a programme's AACCUP/COPC repository.
 *
 * Both a representative and QAC may write here (decision 12) — which of them is
 * calling is not checked, because two RLS policies already say so and a third
 * check in application code could only disagree with them.
 */
export async function uploadRepositoryFile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const programId = String(formData.get("programId") ?? "");
  const folderId = String(formData.get("folderId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const file = formData.get("file");

  if (!programId || !folderId) return { ok: false, error: "Choose a folder." };
  if (!(file instanceof File)) return { ok: false, error: "Choose a file to upload." };
  if (file.type !== "application/pdf") return { ok: false, error: "Repository files must be PDFs." };

  const docUuid = crypto.randomUUID();
  // {campus}/{college?}/{program}/{folder}/… per §2.8, keyed on the document uuid
  // so two files of the same name cannot collide.
  const path = `${programId}/${folderId}/${docUuid}.pdf`;

  const stored = await uploadFile(supabase, BUCKETS.repository, path, file, {
    contentType: "application/pdf",
  });
  if (stored.error) return { ok: false, error: stored.error };

  const { error } = await supabase.from("repository_files").insert({
    program_id: programId,
    folder_id: folderId,
    title: title || file.name,
    storage_path: path,
    file_size: file.size,
    uploaded_by: user.id,
  });

  if (error) {
    await supabase.storage.from(BUCKETS.repository).remove([path]);
    return { ok: false, error: error.message };
  }

  revalidatePath("/portal/documents");
  return { ok: true };
}

/** Archive rather than delete — these are award records, and a web form should
 *  not be able to destroy them. There is no delete policy on the table at all. */
export async function archiveRepositoryFile(fileId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("repository_files")
    .update({ is_archived: true })
    .eq("id", fileId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/documents");
  return { ok: true };
}
