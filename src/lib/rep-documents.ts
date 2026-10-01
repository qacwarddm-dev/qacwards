import { createClient } from "@/lib/supabase/server";
import { getMyPrograms } from "@/lib/submissions";
import { areaLabel, fileSize, programMid, shortDate } from "@/lib/program-names";

export type TemplateTile = { name: string; templateId: string | null; isPdf: boolean };
export type TemplateGroup = { key: string; name: string; chip: string; label: string; full: string; sections: { h?: string; sub?: string; items: TemplateTile[] }[] };

export type RepFolderView = { id: string; name: string; org: "AACCUP" | "CHED" | "PUP"; files: { id: string; name: string; date: string; iso: string; size: string; program: string }[] };

export type RecordRow = { title: string; sub: string; color: string; href?: string };
export type ProgramRecord = { id: string; name: string; stage: string; stageSub: string; last: string; lastSub: string; next: string; nextSub: string; rows: RecordRow[] };

export type RepDocumentsData = {
  templates: TemplateGroup[];
  nda: { status: "none" | "review" | "verified" | "returned"; fileId: string | null; note: string | null; path: string | null };
  common: { id: string; title: string; date: string; size: string }[];
  folders: RepFolderView[];
  records: ProgramRecord[];
};

const ORG: Record<string, RepFolderView["org"]> = {
  "aaccup-certificate": "AACCUP",
  "aaccup-summary-of-findings-and-recommendation": "AACCUP",
  "aaccup-technical-review": "AACCUP",
  "certificate-of-compliance-copc-certificate": "CHED",
  "certificate-of-compliance-copc-evaluation": "CHED",
  "other-files": "PUP",
};

export async function getRepDocuments(userId: string): Promise<RepDocumentsData> {
  const supabase = await createClient();
  const programs = await getMyPrograms();
  const ids = programs.map((p) => p.id);
  const [{ data: levels }, { data: areas }, { data: templates }, { data: nda }, { data: common }, { data: folders }, { data: files }, { data: awards }, { data: subs }] =
    await Promise.all([
      supabase.from("accreditation_levels").select("id, code, name").order("ordinal"),
      supabase.from("requirement_areas").select("id, level_id, name, ordinal, is_optional").order("ordinal"),
      supabase.from("templates").select("id, title, storage_path, requirement_area_id, level_id, is_published").eq("is_published", true),
      supabase.from("ndas").select("status, file_id, review_note, storage_path").eq("profile_id", userId).maybeSingle(),
      supabase.from("common_documents").select("id, title, updated_at, created_at, file_size").order("title"),
      supabase.from("repository_folders").select("id, slug, name, ordinal").order("ordinal"),
      ids.length
        ? supabase.from("repository_files").select("id, title, folder_id, created_at, file_size, program_id, programs(name)").in("program_id", ids).eq("is_archived", false).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as never[] }),
      ids.length
        ? supabase.from("program_accreditations").select("program_id, granted_on, valid_until, status, accreditation_levels!level_id(code, name)").in("program_id", ids).order("granted_on", { ascending: false })
        : Promise.resolve({ data: [] as never[] }),
      ids.length
        ? supabase.from("submissions").select("id, program_id, status, accreditation_levels(code, name, ordinal), assignments(site_visit_date)").in("program_id", ids)
        : Promise.resolve({ data: [] as never[] }),
    ]);

  const byCode = (c: string) => (levels ?? []).find((l) => l.code === c);
  const tile = (a: { id: string; name: string }) => {
    const t = (templates ?? []).find((x) => x.requirement_area_id === a.id);
    return { name: areaLabel(a.name), templateId: t?.id ?? null, isPdf: Boolean(t?.storage_path.toLowerCase().endsWith(".pdf")) };
  };
  const areasOf = (code: string) => (areas ?? []).filter((a) => a.level_id === byCode(code)?.id);
  const l3 = areasOf("III");
  const tplGroups: TemplateGroup[] = [
    { key: "l12", name: "PSV – LEVEL II", chip: "PSV · L1–L2", label: "PSV - Level II", full: "Preliminary Survey Visit, Level I & Level II", sections: [{ items: areasOf("PSV").map(tile) }] },
    {
      key: "l3",
      name: "LEVEL III",
      chip: "L3",
      label: "Level III",
      full: "Level III",
      sections: [
        { h: "MANDATORY", sub: "Required for every program", items: l3.filter((a) => !a.is_optional).map(tile) },
        { h: "CHOOSE TWO (2)", sub: "Your program submits any 2 of these 5 areas", items: l3.filter((a) => a.is_optional).map(tile) },
      ],
    },
    { key: "l4", name: "LEVEL IV", chip: "L4", label: "Level IV", full: "Level IV", sections: [{ items: areasOf("IV").map(tile) }] },
  ];

  const folderViews: RepFolderView[] = (folders ?? []).map((f) => ({
    id: f.id,
    name: f.name.replace("Certificate of Compliance", "Certificate of Program Compliance"),
    org: ORG[f.slug] ?? "PUP",
    files: (files ?? [])
      .filter((x) => x.folder_id === f.id)
      .map((x) => ({ id: x.id, name: x.title, iso: x.created_at, date: shortDate(x.created_at), size: fileSize(x.file_size), program: x.programs?.name ?? "" })),
  }));

  const records: ProgramRecord[] = programs.map((p) => {
    const aw = (awards ?? []).filter((a) => a.program_id === p.id);
    const ss = (subs ?? []).filter((s) => s.program_id === p.id).sort((a, b) => (b.accreditation_levels?.ordinal ?? 0) - (a.accreditation_levels?.ordinal ?? 0));
    const cur = ss[0];
    const visits = ss
      .map((s) => ({ s, d: (Array.isArray(s.assignments) ? s.assignments[0] : s.assignments)?.site_visit_date ?? null }))
      .filter((v) => v.d)
      .sort((a, b) => (b.d ?? "").localeCompare(a.d ?? ""));
    const today = new Date().toISOString().slice(0, 10);
    const past = visits.find((v) => (v.d ?? "") <= today);
    const upcoming = [...visits].reverse().find((v) => (v.d ?? "") > today);
    const rows: RecordRow[] = [];
    if (upcoming) rows.push({ title: `${upcoming.s.accreditation_levels?.name} Survey Visit`, sub: `Scheduled · ${shortDate(upcoming.d)}`, color: "#eab308" });
    for (const a of aw)
      rows.push({
        title: `${a.accreditation_levels?.name ?? "Accreditation"}${a.accreditation_levels?.code === "PSV" ? "" : " accreditation"}`,
        sub: `${a.status === "active" ? "Granted" : a.status === "superseded" ? "Superseded" : a.status} · ${shortDate(a.granted_on)}${a.valid_until ? ` · valid until ${shortDate(a.valid_until)}` : ""}`,
        color: a.status === "active" ? "#22a33a" : "#999",
        href: "/portal/documents?tab=reports",
      });
    for (const f of folderViews.find((x) => x.org === "CHED" && x.name.includes("Certificate"))?.files.filter((x) => x.program === p.label) ?? [])
      rows.push({ title: "Certificate of Program Compliance (CHED)", sub: `Issued · ${f.date}`, color: "#22a33a", href: "/portal/documents?tab=reports" });
    return {
      id: p.id,
      name: programMid(p.label),
      stage: cur?.accreditation_levels?.name ?? "Not started",
      stageSub: cur ? cur.status.replace(/_/g, " ") : "No submission yet",
      last: past ? shortDate(past.d) : "—",
      lastSub: past ? `${past.s.accreditation_levels?.name}` : "No visit yet",
      next: upcoming ? shortDate(upcoming.d) : "—",
      nextSub: upcoming ? `${upcoming.s.accreditation_levels?.name} Survey Visit` : "Not scheduled",
      rows,
    };
  });

  return {
    templates: tplGroups,
    nda: {
      status: (nda?.status as RepDocumentsData["nda"]["status"]) ?? "none",
      fileId: nda?.file_id ?? null,
      note: nda?.review_note ?? null,
      path: nda?.storage_path ?? null,
    },
    common: (common ?? []).map((c) => ({ id: c.id, title: c.title, date: shortDate(c.updated_at ?? c.created_at), size: fileSize(c.file_size) })),
    folders: folderViews,
    records,
  };
}
