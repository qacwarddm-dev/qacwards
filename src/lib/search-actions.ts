"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { programShort, shortDate } from "@/lib/program-names";

export type SearchHit = {
  group: "Pages" | "Documents" | "Events";
  title: string;
  sub: string;
  href: string;
  /** Matched passage from inside the file, matches wrapped in « ». */
  snippet?: string;
};

export async function searchPortal(q: string): Promise<SearchHit[]> {
  const user = await getCurrentUser();
  const term = q.trim().replace(/[%_,()]/g, " ");
  if (!user || term.length < 2) return [];
  const supabase = await createClient();
  const [{ data: found }, { data: docs }, { data: events }] = await Promise.all([
    supabase.rpc("search_documents", { p_query: term }),
    supabase
      .from("submission_documents")
      .select("id, title, submission_id, phase_document_id, requirement_area_id, submissions(program_id, programs(name), accreditation_levels(name))")
      .eq("is_current", true)
      .ilike("title", `%${term}%`)
      .limit(8),
    supabase.from("events").select("id, title, start_time").is("cancelled_at", null).ilike("title", `%${term}%`).limit(6),
  ]);
  const qac = user.role === "qac_personnel" || user.role === "qac_admin";
  const docBase = user.role === "program_representative" ? "/portal/submission" : user.role === "internal_accreditor" ? "/portal/evaluation" : "/portal/assignment";
  const where = (program: string | null, level: string | null) => [programShort(program ?? ""), level].filter(Boolean).join(" · ");

  const byContent: SearchHit[] = [];
  const seen = new Set<string>();
  for (const d of found ?? []) {
    if (d.kind !== "submission" && user.role === "internal_accreditor") continue;
    seen.add(d.id);
    const base = { group: "Documents" as const, title: d.title, snippet: d.snippet?.includes("«") ? d.snippet : undefined };
    if (d.kind === "submission") byContent.push({ ...base, sub: where(d.program, d.level), href: `${docBase}?sub=${d.ref_id}` });
    else if (d.kind === "repository") byContent.push({ ...base, sub: [where(d.program, null), "AACCUP & COPC"].filter(Boolean).join(" · "), href: qac ? "/portal/aaccup-copc" : "/portal/documents?tab=reports" });
    else if (d.kind === "common") byContent.push({ ...base, sub: "Common Documents", href: "/portal/documents?tab=common" });
    else byContent.push({ ...base, sub: "Template", href: "/portal/documents" });
  }

  return [
    ...byContent,
    ...(docs ?? [])
      .filter((d) => !seen.has(d.id))
      .map((d) => ({
        group: "Documents" as const,
        title: d.title,
        sub: where(d.submissions?.programs?.name ?? null, d.submissions?.accreditation_levels?.name ?? null),
        href: `${docBase}?sub=${d.submission_id}`,
      })),
    ...(events ?? []).map((e) => ({
      group: "Events" as const,
      title: e.title,
      sub: shortDate(e.start_time),
      href: `/portal/events?date=${e.start_time.slice(0, 10)}`,
    })),
  ];
}

export type TextKind = "submission" | "common" | "repository" | "template";

const TEXT_TABLES = {
  submission: "submission_documents",
  common: "common_documents",
  repository: "repository_files",
  template: "templates",
} as const;

/** Ids of the caller's readable files whose name or text has every word, each
 *  as a prefix — the same rule as search_documents. */
export async function matchDocumentText(kinds: TextKind[], q: string): Promise<string[]> {
  const words = q.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (!words.length || q.trim().length < 2 || !(await getCurrentUser())) return [];
  const query = words.map((w) => `'${w}':*`).join(" & ");
  const supabase = await createClient();
  const results = await Promise.all(
    kinds.map((k) => supabase.from(TEXT_TABLES[k]).select("id").textSearch("search_tsv", query, { config: "english" }).limit(1000)),
  );
  return results.flatMap((r) => (r.data ?? []).map((x) => x.id));
}
