import { readFile } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NDA_TEMPLATE_PATH, stampNdaTemplate } from "@/lib/nda";
import { newNdaFileId } from "@/lib/nda-id";
import { BUCKETS } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // A preview is the unstamped built-in form; it carries no File ID, so an upload of it fails the NDA check.
  if (request.nextUrl.searchParams.get("preview") === "1") {
    return new NextResponse(Buffer.from(await readFile(NDA_TEMPLATE_PATH)), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline", "Cache-Control": "no-store" },
    });
  }

  const fileId = newNdaFileId();
  const { error } = await supabase
    .from("nda_issuances")
    .insert({ file_id: fileId, profile_id: user.id });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: custom } = await supabase.from("templates").select("storage_path").eq("group_key", "nda").maybeSingle();
  const stored = custom ? await supabase.storage.from(BUCKETS.templates).download(custom.storage_path) : null;
  const bytes = await stampNdaTemplate(fileId, stored?.data ? new Uint8Array(await stored.data.arrayBuffer()) : undefined);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="QAC-NDA-${fileId.slice(8)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
