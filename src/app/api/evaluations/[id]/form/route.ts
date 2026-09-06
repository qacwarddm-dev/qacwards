import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildEvaluationForm } from "@/lib/evaluation-form";

/**
 * The generated Accreditation Visit Evaluation Form (round 2 §4).
 *
 * A route rather than a server action because the answer is a file: the browser
 * navigates here and saves what comes back, which an action returning bytes
 * through the RSC payload cannot do.
 *
 * Authorization is `buildEvaluationForm`'s reads running on the caller's own
 * session client — RLS returns zero rows to anyone not on the team and not QAC,
 * which becomes the same 404 a genuinely missing assignment gets. The route adds
 * no role check of its own, deliberately (plans/BACKEND.md §1).
 */
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
  const result = await buildEvaluationForm(supabase, id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return new NextResponse(Buffer.from(result.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
      // Generated per request off live rows: a cached copy would show a stale
      // verdict, and it carries signatures, so no shared cache may hold it.
      "Cache-Control": "no-store, private",
    },
  });
}
