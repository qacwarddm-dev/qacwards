"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { programShort, shortDate } from "@/lib/program-names";

export type SearchHit = {
  group: "Pages" | "Documents" | "Events";
  title: string;
  sub: string;
  href: string;
};

export async function searchPortal(q: string): Promise<SearchHit[]> {
  const user = await getCurrentUser();
  const term = q.trim().replace(/[%_,()]/g, " ");
  if (!user || term.length < 2) return [];
  const supabase = await createClient();
  const [{ data: docs }, { data: events }] = await Promise.all([
    supabase
      .from("submission_documents")
      .select("id, title, submission_id, phase_document_id, requirement_area_id, submissions(program_id, programs(name), accreditation_levels(name))")
      .eq("is_current", true)
      .ilike("title", `%${term}%`)
      .limit(8),
    supabase.from("events").select("id, title, start_time").is("cancelled_at", null).ilike("title", `%${term}%`).limit(6),
  ]);
  const docBase = user.role === "program_representative" ? "/portal/submission" : user.role === "internal_accreditor" ? "/portal/evaluation" : "/portal/assignment";
  return [
    ...(docs ?? []).map((d) => ({
      group: "Documents" as const,
      title: d.title,
      sub: `${programShort(d.submissions?.programs?.name ?? "")} · ${d.submissions?.accreditation_levels?.name ?? ""}`,
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
