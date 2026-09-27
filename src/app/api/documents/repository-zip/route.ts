import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS, downloadFile } from "@/lib/storage";
import { zipStore } from "@/lib/zip";

export const runtime = "nodejs";

/** One repository folder of one programme as a .zip. RLS on `repository_files` decides what is included. */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const programId = request.nextUrl.searchParams.get("program");
  const folderId = request.nextUrl.searchParams.get("folder");
  const name = (request.nextUrl.searchParams.get("name") ?? "folder").replace(/[^\w .()-]+/g, "_");
  if (!programId || !folderId) {
    return NextResponse.json({ error: "Unknown folder." }, { status: 400 });
  }

  const { data: rows } = await supabase
    .from("repository_files")
    .select("title, storage_path")
    .eq("program_id", programId)
    .eq("folder_id", folderId)
    .eq("is_archived", false);

  const used = new Set<string>();
  const files: { name: string; data: Uint8Array }[] = [];
  for (const row of rows ?? []) {
    const got = await downloadFile(supabase, BUCKETS.repository, row.storage_path);
    if (!got.data) continue;
    const base = row.title.replace(/[\\/:*?"<>|]+/g, "_").replace(/\.pdf$/i, "");
    let entry = `${base}.pdf`;
    for (let n = 2; used.has(entry); n++) entry = `${base} (${n}).pdf`;
    used.add(entry);
    files.push({ name: entry, data: got.data });
  }

  return new NextResponse(Buffer.from(zipStore(files)), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${name}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
