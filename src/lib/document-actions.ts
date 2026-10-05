"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS, checkUploaded } from "@/lib/storage";
import { checkNdaScan, normalizeNdaFileId } from "@/lib/nda";
import { inspectPdf } from "@/lib/pdf";

/**
 * Writes behind the document families.
 *
 * The NDA unlocks Common Documents only when the upload names a file id this
 * user was issued by the template download, carries the full notarial details,
 * and is not the unsigned template itself. The `ndas` insert/update policies
 * repeat the file-id check, so a direct API write cannot skip it.
 *
 * The scan goes browser → Storage directly (a notarized scan easily passes the
 * host's request-body cap); this action receives only the path and reads the
 * object back to inspect it.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

const MAX_NDA_BYTES = 10 * 1024 * 1024;

const NOTARIAL_NUMBER = /^[0-9]{1,6}$|^[IVXLCDM]{1,10}$/i;

export async function uploadNda(formData: FormData): Promise<ActionResult> {
  try {
    return await saveNda(formData);
  } catch (e) {
    console.error("uploadNda failed", e);
    return { ok: false, error: "We couldn’t process that file. Make sure it is a PDF scan under 10 MB and try again." };
  }
}

async function saveNda(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const field = (k: string) => String(formData.get(k) ?? "").trim();
  const path = field("path");
  if (!path) return { ok: false, error: "Choose the scanned, signed and notarized NDA." };
  const uploaded = await checkUploaded(supabase, BUCKETS.ndas, { path, prefix: `${user.id}/`, name: field("fileName"), exts: [".pdf"], max: MAX_NDA_BYTES });
  if ("error" in uploaded) return { ok: false, error: uploaded.error };
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

  const { data: blob } = await supabase.storage.from(BUCKETS.ndas).download(path);
  if (!blob) return { ok: false, error: "Upload did not complete. Try again." };
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const pdfCheck = await inspectPdf(bytes);
  if (!pdfCheck.ok) return { ok: false, error: pdfCheck.error };

  const scan = await checkNdaScan(bytes, fileId);
  if (!scan.ok) return { ok: false, error: scan.error };

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
    status: "review",
    review_note: null,
    reviewed_by: null,
    reviewed_at: null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/documents");
  return { ok: true };
}

export async function getOwnNdaUrl(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("ndas").select("storage_path").eq("profile_id", user.id).maybeSingle();
  if (!data) return null;
  const s = await supabase.storage.from(BUCKETS.ndas).createSignedUrl(data.storage_path, 300);
  return s.data?.signedUrl ?? null;
}

export async function countCommonView(id: string) {
  const supabase = await createClient();
  await supabase.rpc("count_common_document_view", { p_id: id });
}
