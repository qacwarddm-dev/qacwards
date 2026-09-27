import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildEvaluationSheetPdf } from "@/lib/evaluation-sheet-pdf";

/** The IA Evaluation Sheet as a PDF (QAC FORM NO.005, per-level layout).
 *  Authorization is the RLS on the reads inside the builder: team and QAC get
 *  rows, anyone else gets the same 404 as a missing assignment. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;
  const result = await buildEvaluationSheetPdf(supabase, id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return new NextResponse(Buffer.from(result.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
      "Cache-Control": "no-store, private",
    },
  });
}
