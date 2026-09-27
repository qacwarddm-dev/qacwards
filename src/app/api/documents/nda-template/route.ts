import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { newNdaFileId, stampNdaTemplate } from "@/lib/nda";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const fileId = newNdaFileId();
  const { error } = await supabase
    .from("nda_issuances")
    .insert({ file_id: fileId, profile_id: user.id });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const bytes = await stampNdaTemplate(fileId);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="QAC-NDA-${fileId.slice(8)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
