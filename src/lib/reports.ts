import { createClient } from "@/lib/supabase/server";
import { personName } from "@/lib/program-names";
import { isReportType, type CatalogProgram, type ReportFilters, type SavedReport } from "@/lib/report-model";

export async function getReportsData(): Promise<{ saved: SavedReport[]; catalog: CatalogProgram[]; colleges: [string, string][] }> {
  const supabase = await createClient();
  const [{ data: saved }, { data: programs }, { data: copc }, { data: colleges }] = await Promise.all([
    supabase.from("saved_reports").select("id, type, title, scope, filters, created_at, profiles:created_by(surname, given_name)").order("created_at", { ascending: false }),
    supabase.from("programs").select("id, name, campuses(name), colleges(code)").order("name"),
    supabase
      .from("repository_files")
      .select("program_id, repository_folders!inner(slug)")
      .eq("is_archived", false)
      .eq("repository_folders.slug", "certificate-of-compliance-copc-certificate"),
    supabase.from("colleges").select("code, name").order("code"),
  ]);
  const copcSet = new Set((copc ?? []).map((r) => r.program_id));
  return {
    saved: (saved ?? []).flatMap((r) =>
      isReportType(r.type)
        ? [{ id: r.id, type: r.type, title: r.title, scope: r.scope, filters: r.filters as ReportFilters, by: r.profiles ? personName(r.profiles) : "—", date: r.created_at }]
        : [],
    ),
    catalog: (programs ?? []).map((p) => ({ name: p.name, college: p.colleges?.code ?? "NA", campus: p.campuses?.name ?? "—", copc: copcSet.has(p.id) })),
    colleges: (colleges ?? []).map((c) => [c.code, c.name]),
  };
}
