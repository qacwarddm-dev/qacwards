import { createClient } from "@/lib/supabase/browser";
import type { BucketName } from "@/lib/storage";

export const MAX_UPLOAD = 25 * 1024 * 1024;

export const safeName = (n: string) => n.replace(/[^\w.\-]+/g, "-").slice(-120);

export async function uploadDirect(bucket: BucketName, path: string, file: File, contentType: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (file.size > MAX_UPLOAD) return { ok: false, error: "File is over 25 MB." };
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "Your session expired. Sign in again, then retry the upload." };
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType, upsert: false });
  return error ? { ok: false, error: error.message } : { ok: true };
}
