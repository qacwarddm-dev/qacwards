import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS, type BucketName, signedUrl } from "@/lib/storage";

/**
 * The one download route.
 *
 * Every bucket in this system is private (§2.8), so a file is only ever served
 * through a short-lived signed URL minted **after** the caller has been allowed
 * to read the row that names it. That ordering is the whole point: the row read
 * goes through RLS, so a user who may not see the document gets nothing to sign.
 *
 * The client never sends a storage path — it sends a table and a row id. Letting
 * a caller name a path directly would turn any signed-URL endpoint into a way to
 * fetch arbitrary objects, and the path would be attacker-controlled input to the
 * one call that grants access.
 */
const SOURCES = {
  submission: {
    table: "submission_documents",
    bucket: BUCKETS.submissions,
  },
  repository: {
    table: "repository_files",
    bucket: BUCKETS.repository,
  },
  template: {
    table: "templates",
    bucket: BUCKETS.templates,
  },
  common: {
    table: "common_documents",
    bucket: BUCKETS.commonDocs,
  },
} as const;

type SourceKey = keyof typeof SOURCES;

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const source = request.nextUrl.searchParams.get("source") as SourceKey | null;
  const id = request.nextUrl.searchParams.get("id");

  if (!source || !id || !(source in SOURCES)) {
    return NextResponse.json({ error: "Unknown document." }, { status: 400 });
  }

  const { table, bucket } = SOURCES[source];

  const { data: row } = await supabase
    .from(table)
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  // Zero rows is what RLS returns to someone who may not read this — so a
  // forbidden document and a missing one are the same 404, and the response never
  // reveals that the document exists (§1).
  if (!row) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const signed = await signedUrl(supabase, bucket as BucketName, row.storage_path);
  if (signed.data === null) {
    return NextResponse.json({ error: signed.error }, { status: 500 });
  }

  return NextResponse.redirect(signed.data);
}
