import { createClient } from "@/lib/supabase/server";
import { areaLabel, fileSize, personName, shortDate } from "@/lib/program-names";
import { getNdaQueue, type NdaItem } from "@/lib/qac-portal";

export type TplGroupKey = "areas" | "l3" | "l4" | "gen";
export type TplVersion = { id: string | null; ver: number; file: string; date: string; by: string; cur?: boolean };
export type TplRow = {
  key: string;
  id: string | null;
  areaId: string | null;
  levelId: string | null;
  name: string;
  sub?: string;
  file: string | null;
  ext: "docx" | "pdf";
  ver: number;
  date: string;
  by: string;
  published: boolean;
  history: TplVersion[];
};
export type TplGroup = { key: TplGroupKey; label: string; rows: TplRow[] };
export type CommonDoc = { id: string; title: string; category: string; visibleTo: string; date: string; size: string; views: number; deletedAt: string | null };
export type NdaForm = { id: string | null; file: string; ver: number; date: string; dl: number };
export type QacDocumentsData = { groups: TplGroup[]; common: CommonDoc[]; commonDeleted: CommonDoc[]; ndaForm: NdaForm; ndas: NdaItem[]; colleges: [string, string][] };

const fileOf = (p: string) => p.split("/").pop() ?? p;

export async function getQacDocuments(): Promise<QacDocumentsData> {
  const supabase = await createClient();
  const [{ data: levels }, { data: areas }, { data: tpls }, { data: hist }, { data: common }, { count: issued }, ndas, { data: colleges }] = await Promise.all([
    supabase.from("accreditation_levels").select("id, code").order("ordinal"),
    supabase.from("requirement_areas").select("id, level_id, name, ordinal, is_optional").order("ordinal"),
    supabase
      .from("templates")
      .select("id, title, storage_path, requirement_area_id, level_id, group_key, version, is_published, updated_at, created_at, profiles:uploaded_by(surname, given_name)")
      .order("created_at"),
    supabase.from("template_versions").select("id, template_id, version, file_name, created_at, profiles:uploaded_by(surname, given_name)").order("version", { ascending: false }),
    supabase.from("common_documents").select("id, title, category, visible_to, view_count, file_size, created_at, updated_at, deleted_at").order("updated_at", { ascending: false }),
    supabase.from("nda_issuances").select("file_id", { count: "exact", head: true }),
    getNdaQueue(),
    supabase.from("colleges").select("code, name").order("code"),
  ]);

  const T = tpls ?? [];
  const lv = (code: string) => (levels ?? []).find((l) => l.code === code)?.id ?? null;
  const toRow = (t: (typeof T)[number] | undefined, base: { key: string; name: string; sub?: string; areaId: string | null; levelId: string | null }): TplRow => {
    const history: TplVersion[] = t
      ? [
          { id: null, ver: t.version, file: fileOf(t.storage_path), date: shortDate(t.updated_at), by: t.profiles ? personName(t.profiles) : "—", cur: true },
          ...(hist ?? [])
            .filter((h) => h.template_id === t.id)
            .map((h) => ({ id: h.id, ver: h.version, file: h.file_name, date: shortDate(h.created_at), by: h.profiles ? personName(h.profiles) : "—" })),
        ]
      : [];
    return {
      ...base,
      id: t?.id ?? null,
      file: t ? fileOf(t.storage_path) : null,
      ext: t?.storage_path.toLowerCase().endsWith(".pdf") ? "pdf" : "docx",
      ver: t?.version ?? 0,
      date: t ? shortDate(t.updated_at) : "—",
      by: t?.profiles ? personName(t.profiles) : "",
      published: t?.is_published ?? false,
      history,
    };
  };
  const areaRows = (code: string, group: TplGroupKey, sub?: (a: { is_optional: boolean }) => string) => {
    const id = lv(code);
    const rows = (areas ?? [])
      .filter((a) => a.level_id === id)
      .map((a) => toRow(T.find((t) => t.requirement_area_id === a.id), { key: a.id, name: areaLabel(a.name), sub: sub?.(a), areaId: a.id, levelId: id }));
    const extra = T.filter((t) => t.group_key === group && !t.requirement_area_id).map((t) => toRow(t, { key: t.id, name: t.title, areaId: null, levelId: id }));
    return [...rows, ...extra];
  };

  const groups: TplGroup[] = [
    { key: "areas", label: "PSV · Level I · Level II", rows: areaRows("PSV", "areas") },
    { key: "l3", label: "Level III", rows: areaRows("III", "l3", (a) => (a.is_optional ? "Choose two (2)" : "Mandatory")) },
    { key: "l4", label: "Level IV", rows: areaRows("IV", "l4") },
    {
      key: "gen",
      label: "General",
      rows: T.filter((t) => t.group_key === "gen").map((t) => toRow(t, { key: t.id, name: t.title, sub: "Used in every upload form", areaId: null, levelId: null })),
    },
  ];

  const toCommon = (c: NonNullable<typeof common>[number]): CommonDoc => ({
    id: c.id,
    title: c.title,
    category: c.category,
    visibleTo: c.visible_to,
    date: shortDate(c.updated_at ?? c.created_at),
    size: fileSize(c.file_size),
    views: c.view_count,
    deletedAt: c.deleted_at,
  });
  const nda = T.filter((t) => t.group_key === "nda").at(-1);
  return {
    groups,
    common: (common ?? []).filter((c) => !c.deleted_at).map(toCommon),
    commonDeleted: (common ?? []).filter((c) => c.deleted_at).sort((a, b) => b.deleted_at!.localeCompare(a.deleted_at!)).map(toCommon),
    ndaForm: {
      id: nda?.id ?? null,
      file: nda ? fileOf(nda.storage_path) : "QAC-NDA-Form.pdf",
      ver: nda?.version ?? 1,
      date: nda ? shortDate(nda.updated_at) : "—",
      dl: issued ?? 0,
    },
    ndas,
    colleges: (colleges ?? []).map((c) => [c.code, c.name]),
  };
}
