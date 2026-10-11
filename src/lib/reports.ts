import { createClient } from "@/lib/supabase/server";
import { manilaDay, personName } from "@/lib/program-names";
import { campusLabel, certValidity, certDate, type CertSource } from "@/lib/cert-model";
import { isReportType, type CatalogProgram, type ReportFilters, type SavedReport } from "@/lib/report-model";

export async function getReportsData(): Promise<{ saved: SavedReport[]; catalog: CatalogProgram[]; colleges: [string, string][]; cert: CertSource[] }> {
  const supabase = await createClient();
  const [{ data: saved }, { data: programs }, { data: copc }, { data: colleges }] = await Promise.all([
    supabase.from("saved_reports").select("id, type, title, scope, filters, created_at, profiles:created_by(surname, given_name)").order("created_at", { ascending: false }),
    supabase.from("programs").select("id, name, campuses(name), colleges(code)").is("deleted_at", null).order("name"),
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
    cert: await getCertSource(),
  };
}

/** Every program's AACCUP certificates and latest survey visit, grouped campus → college for the Certification of Accreditation Status. */
async function getCertSource(): Promise<CertSource[]> {
  const supabase = await createClient();
  const [{ data: programs }, { data: certs }, { data: visits }] = await Promise.all([
    supabase.from("programs").select("id, name, campuses(name, is_main), colleges(code, name)").is("deleted_at", null).order("name"),
    supabase
      .from("repository_files")
      .select("program_id, cert_status, valid_from, valid_until, repository_folders!inner(slug)")
      .eq("is_archived", false)
      .eq("repository_folders.slug", "aaccup-certificate")
      .not("valid_until", "is", null)
      .order("valid_from"),
    supabase.from("assignments").select("site_visit_date, submissions!assignments_submission_id_fkey(program_id)").not("site_visit_date", "is", null).lte("site_visit_date", manilaDay()).order("site_visit_date"),
  ]);

  const statuses = new Map<string, [string, string][]>();
  for (const c of certs ?? []) {
    if (!c.cert_status) continue;
    statuses.set(c.program_id, [...(statuses.get(c.program_id) ?? []), [c.cert_status === "Candidate Status" ? "Candidate" : c.cert_status, certValidity(c.valid_from, c.valid_until)]]);
  }
  const visit = new Map<string, string>();
  for (const v of (visits ?? []) as { site_visit_date: string; submissions: { program_id: string } | null }[]) {
    if (v.submissions) visit.set(v.submissions.program_id, certDate(v.site_visit_date));
  }

  const byCampus = new Map<string, { isMain: boolean; colleges: Map<string, CertSource["colleges"][number]> }>();
  for (const p of programs ?? []) {
    const list = statuses.get(p.id);
    if (!list?.length) continue;
    const name = p.campuses?.name ?? "—";
    const isMain = Boolean(p.campuses?.is_main);
    const campus = byCampus.get(name) ?? { isMain, colleges: new Map() };
    byCampus.set(name, campus);
    const code = isMain ? (p.colleges?.code ?? "") : "";
    const college = campus.colleges.get(code) ?? { code, name: isMain ? (p.colleges?.name ?? "") : "", programs: [] };
    campus.colleges.set(code, college);
    college.programs.push({ name: p.name, statuses: list, visit: visit.get(p.id) ?? "-" });
  }

  return [...byCampus.entries()]
    .sort(([an, a], [bn, b]) => Number(b.isMain) - Number(a.isMain) || an.localeCompare(bn))
    .map(([name, c]) => ({
      name,
      label: campusLabel(name, c.isMain),
      colleges: [...c.colleges.values()].sort((a, b) => a.code.localeCompare(b.code)),
    }));
}
