import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { extractText } from "@/lib/doc-text";
import { BUCKETS, type BucketName } from "@/lib/storage";

export type DocKind = "submission" | "common" | "repository" | "template";

const SOURCES = {
  submission: { table: "submission_documents", bucket: BUCKETS.submissions },
  common: { table: "common_documents", bucket: BUCKETS.commonDocs },
  repository: { table: "repository_files", bucket: BUCKETS.repository },
  template: { table: "templates", bucket: BUCKETS.templates },
} as const satisfies Record<DocKind, { table: string; bucket: BucketName }>;

const TIMEOUT_MS = 25_000;

/** Reads one stored file and saves its text. Needs a QAC session: the writer RPC
 *  refuses everyone else. */
export async function indexDocument(supabase: SupabaseClient<Database>, kind: DocKind, id: string): Promise<void> {
  const { table, bucket } = SOURCES[kind];
  const { data: row } = await supabase.from(table).select("storage_path").eq("id", id).maybeSingle();
  if (!row) return;
  const { data: blob } = await supabase.storage.from(bucket).download(row.storage_path);
  const text = blob ? await extractText(new Uint8Array(await blob.arrayBuffer()), row.storage_path, TIMEOUT_MS) : "";
  const { error } = await supabase.rpc("set_document_text", { p_kind: kind, p_id: id, p_text: text ?? "" });
  if (error) console.error(`indexing ${kind} ${id} failed:`, error.message);
}

export async function indexPending(supabase: SupabaseClient<Database>, budgetMs: number): Promise<{ indexed: number; remaining: number }> {
  const deadline = Date.now() + budgetMs;
  let indexed = 0;
  for (const kind of Object.keys(SOURCES) as DocKind[]) {
    const { data } = await supabase.from(SOURCES[kind].table).select("id").is("content_text", null).limit(50);
    for (const { id } of data ?? []) {
      if (Date.now() + TIMEOUT_MS > deadline) break;
      await indexDocument(supabase, kind, id);
      indexed++;
    }
  }
  let remaining = 0;
  for (const { table } of Object.values(SOURCES)) {
    const { count } = await supabase.from(table).select("id", { count: "exact", head: true }).is("content_text", null);
    remaining += count ?? 0;
  }
  return { indexed, remaining };
}
