"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS, uploadFile } from "@/lib/storage";
import { checkNdaScan, normalizeNdaFileId } from "@/lib/nda";
import { inspectPdf } from "@/lib/pdf";

/**
 * Writes behind the document families.
 *
 * The NDA unlocks Common Documents only when the upload names a file id this
 * user was issued by the template download, carries the full notarial details,
 * and is not the unsigned template itself. The `ndas` insert/update policies
 * repeat the file-id check, so a direct API write cannot skip it.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

const NOTARIAL_NUMBER = /^[0-9]{1,6}$|^[IVXLCDM]{1,10}$/i;

export async function uploadNda(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose the scanned, signed and notarized NDA." };
  }
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: "The NDA must be 10 MB or smaller." };

  const field = (k: string) => String(formData.get(k) ?? "").trim();
  const fileId = normalizeNdaFileId(field("fileId"));
  const attorney = field("attorney");
  const docNo = field("docNo");
  const pageNo = field("pageNo");
  const bookNo = field("bookNo");
  const series = Number(field("series"));

  if (!fileId) return { ok: false, error: "Enter the NDA File ID printed at the top of the form." };
  if (attorney.length < 3 || !/[a-z]/i.test(attorney)) {
    return { ok: false, error: "Enter the notary public's (attorney's) name." };
  }
  for (const [label, value] of [
    ["Document No.", docNo],
    ["Page No.", pageNo],
    ["Book No.", bookNo],
  ] as const) {
    if (!NOTARIAL_NUMBER.test(value)) return { ok: false, error: `${label} must be a number.` };
  }

  const { data: issuance } = await supabase
    .from("nda_issuances")
    .select("issued_at")
    .eq("file_id", fileId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!issuance) {
    return {
      ok: false,
      error: "That NDA File ID was not issued to your account. Download the NDA form from this page.",
    };
  }

  const issuedYear = new Date(issuance.issued_at).getFullYear();
  const thisYear = new Date().getFullYear();
  if (!Number.isInteger(series) || series < issuedYear || series > thisYear) {
    return { ok: false, error: `Series of year must be between ${issuedYear} and ${thisYear}.` };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfCheck = await inspectPdf(bytes);
  if (!pdfCheck.ok) return { ok: false, error: pdfCheck.error };

  const scan = await checkNdaScan(bytes, fileId);
  if (!scan.ok) return { ok: false, error: scan.error };

  const path = `${user.id}/nda-${fileId}-${Date.now()}.pdf`;
  const stored = await uploadFile(supabase, BUCKETS.ndas, path, bytes, {
    contentType: "application/pdf",
  });
  if (stored.error) return { ok: false, error: stored.error };

  const { error } = await supabase.from("ndas").upsert({
    profile_id: user.id,
    storage_path: path,
    uploaded_at: new Date().toISOString(),
    file_id: fileId,
    notary_attorney: attorney,
    notary_doc_no: docNo,
    notary_page_no: pageNo,
    notary_book_no: bookNo.toUpperCase(),
    notary_series: series,
  });

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

function cleanName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ");
  return name.length >= 1 && name.length <= 150 ? name : null;
}

export async function renameRepositoryFile(id: string, rawTitle: string): Promise<ActionResult> {
  const title = cleanName(rawTitle);
  if (!title) return { ok: false, error: "Enter a name up to 150 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("repository_files")
    .update({ title })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "That file could not be renamed." };

  revalidatePath("/portal/documents");
  return { ok: true };
}

export async function renameRepositoryFolder(
  programId: string,
  folderId: string,
  rawName: string,
): Promise<ActionResult> {
  const name = cleanName(rawName);
  if (!name) return { ok: false, error: "Enter a name up to 150 characters." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("repository_folder_prefs")
    .upsert({ program_id: programId, folder_id: folderId, display_name: name });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/documents");
  return { ok: true };
}

export async function deleteRepositoryFolder(
  programId: string,
  folderId: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error: archiveError } = await supabase
    .from("repository_files")
    .update({ is_archived: true })
    .eq("program_id", programId)
    .eq("folder_id", folderId);
  if (archiveError) return { ok: false, error: archiveError.message };

  const { error } = await supabase
    .from("repository_folder_prefs")
    .upsert({ program_id: programId, folder_id: folderId, hidden: true });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/documents");
  return { ok: true };
}
