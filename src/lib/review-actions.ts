"use server";

import { createClient as createPlainClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { canAdvanceAssignment } from "@/lib/assignment-transitions";

export type ActionResult = { ok: true } | { ok: false; error: string };

function refresh() {
  for (const p of ["/portal/evaluation", "/portal/dashboard", "/portal/resubmissions", "/portal/extension-monitoring", "/portal/assignment", "/portal/submission", "/portal/feedback"])
    revalidatePath(p);
}

export async function reviewDocument(
  documentId: string,
  decision: "approved" | "returned" | "undone",
  note?: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (decision === "returned" && !note?.trim()) return { ok: false, error: "Add a remark first so the program knows what to fix" };
  const supabase = await createClient();
  const { error } = await supabase.from("document_reviews").insert({
    submission_document_id: documentId,
    reviewer_id: user.id,
    decision,
    note: note?.trim() || null,
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function approveDocuments(documentIds: string[]): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!documentIds.length) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase
    .from("document_reviews")
    .insert(documentIds.map((id) => ({ submission_document_id: id, reviewer_id: user.id, decision: "approved" })));
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function saveAreaRating(input: {
  assignmentId: string;
  areaId: string;
  indicator: number;
  rating: number | null;
  remark: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const { error } = await supabase.from("area_ratings").upsert({
    assignment_id: input.assignmentId,
    accreditor_id: user.id,
    requirement_area_id: input.areaId,
    indicator: input.indicator,
    rating: input.rating,
    remark: input.remark || null,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal/evaluation");
  return { ok: true };
}

export async function saveReportDraft(assignmentId: string, findings: string, recommendation: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("accreditor_reports")
    .select("status")
    .eq("assignment_id", assignmentId)
    .eq("accreditor_id", user.id)
    .maybeSingle();
  const { error } = existing
    ? await supabase
        .from("accreditor_reports")
        .update({ overall_findings: findings, recommendation, updated_at: new Date().toISOString() })
        .eq("assignment_id", assignmentId)
        .eq("accreditor_id", user.id)
    : await supabase
        .from("accreditor_reports")
        .insert({ assignment_id: assignmentId, accreditor_id: user.id, overall_findings: findings, recommendation, status: "draft" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function passwordMatches(email: string, password: string) {
  const plain = createPlainClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await plain.auth.signInWithPassword({ email, password });
  if (!error) await plain.auth.signOut({ scope: "local" });
  return !error;
}

export async function signAccreditorReport(input: {
  assignmentId: string;
  findings: string;
  recommendation: string;
  grandMean: number;
  password: string;
}): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!user.signaturePath) return { ok: false, error: "Save your e-signature in Profile first." };
  if (!(await passwordMatches(user.webmail, input.password))) return { ok: false, error: "That password is not correct." };

  const supabase = await createClient();
  const { data: code, error } = await supabase.rpc("sign_accreditor_report", {
    p_assignment: input.assignmentId,
    p_findings: input.findings,
    p_recommendation: input.recommendation,
    p_grand_mean: Math.round(input.grandMean * 100) / 100,
  });
  if (error) return { ok: false, error: error.message };

  const [{ data: team }, { data: signed }, { data: asg }] = await Promise.all([
    supabase.from("assignment_accreditors").select("profile_id").eq("assignment_id", input.assignmentId).eq("response", "accepted"),
    supabase.from("accreditor_reports").select("accreditor_id").eq("assignment_id", input.assignmentId).in("status", ["submitted", "acknowledged"]),
    supabase.from("assignments").select("status").eq("id", input.assignmentId).maybeSingle(),
  ]);
  const everyone = (team ?? []).every((m) => (signed ?? []).some((s) => s.accreditor_id === m.profile_id));
  if (everyone && asg) {
    let status = asg.status;
    for (const next of ["for_psv", "evaluated"]) {
      if (canAdvanceAssignment(status, next)) {
        await supabase.from("assignments").update({ status: next as "for_psv" | "evaluated" }).eq("id", input.assignmentId);
        status = next as typeof status;
      }
    }
  }
  refresh();
  return { ok: true, code: code as string };
}
