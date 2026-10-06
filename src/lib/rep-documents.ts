import { createClient } from "@/lib/supabase/server";
import { getMyPrograms } from "@/lib/submissions";
import { areaLabel, fileSize, shortDate } from "@/lib/program-names";

export type TemplateTile = { name: string; templateId: string | null; isPdf: boolean };
export type TemplateGroup = { key: string; name: string; chip: string; label: string; full: string; sections: { h?: string; sub?: string; items: TemplateTile[] }[] };

export type RepFolderView = { id: string; name: string; org: "AACCUP" | "CHED" | "PUP"; files: { id: string; name: string; date: string; iso: string; size: string; program: string }[] };

export type RepDocumentsData = {
  templates: TemplateGroup[];
  nda: { status: "none" | "review" | "verified" | "returned"; fileId: string | null; note: string | null; path: string | null };
  common: { id: string; title: string; date: string; size: string }[];
  folders: RepFolderView[];
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
  const [{ data: levels }, { data: areas }, { data: templates }, { data: nda }, { data: common }, { data: folders }, { data: files }] =
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
  };
}
