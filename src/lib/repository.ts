import { createClient } from "@/lib/supabase/server";
import { personName, programShort } from "@/lib/program-names";

import { FTYPES, type RepoFile, type RepoLoc, type RepoProgram, type RepoType, type RepoUnit, type Repository } from "@/lib/repository-model";
export * from "@/lib/repository-model";

const PAGE = 1000;

async function loadAllFiles(supabase: Awaited<ReturnType<typeof createClient>>) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data } = await supabase
      .from("repository_files")
      .select("id, title, program_id, folder_id, unit_id, created_at, is_archived, archived_at, valid_from, valid_until, cert_status, accreditation_levels(code), profiles:uploaded_by(surname, given_name)")
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, from + PAGE - 1);
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < PAGE) break;
  }
  return { data: rows };
}

export async function getRepository(): Promise<Repository> {
  const supabase = await createClient();
  const [{ data: folders }, { data: colleges }, { data: campuses }, { data: custom }, { data: programs }, { data: files }] = await Promise.all([
    supabase.from("repository_folders").select("id, ordinal").order("ordinal"),
    supabase.from("colleges").select("code, name").order("name"),
    supabase.from("campuses").select("name, is_main").eq("is_main", false).order("name"),
    supabase.from("repository_units").select("id, location, name").order("created_at"),
    supabase.from("programs").select("id, name, campuses(name, is_main), colleges(code)").is("deleted_at", null).order("name"),
    loadAllFiles(supabase),
  ]);

  const folderIds = {} as Record<RepoType, string>;
  const typeOf = new Map<string, RepoType>();
  (folders ?? []).forEach((f, i) => {
    const t = FTYPES[Math.min(i, FTYPES.length - 1)].key;
    folderIds[t] = f.id;
    typeOf.set(f.id, t);
  });

  const units: RepoUnit[] = [
    ...(colleges ?? []).map((c) => ({ key: c.code, name: `${c.name} (${c.code})`, loc: "main" as const, college: c.code })),
    ...(campuses ?? []).map((c) => ({ key: c.name, name: c.name, loc: "camp" as const })),
    ...(custom ?? []).map((u) => ({ key: u.name, name: u.name, loc: (u.location === "main" ? "main" : "camp") as RepoLoc, customId: u.id })),
  ];
  const unitById = new Map((custom ?? []).map((u) => [u.id, u.name]));

  const progs: RepoProgram[] = (programs ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    short: programShort(p.name),
    unit: p.campuses?.is_main ? (p.colleges?.code ?? "—") : (p.campuses?.name ?? "—"),
  }));
  const progById = new Map(progs.map((p) => [p.id, p]));
  const locOf = (unit: string): RepoLoc => units.find((u) => u.key === unit)?.loc ?? "camp";

  const out: RepoFile[] = (files ?? []).flatMap((f) => {
    const p = progById.get(f.program_id);
    const type = typeOf.get(f.folder_id);
    if (!p || !type) return [];
    const unit = (f.unit_id && unitById.get(f.unit_id)) || p.unit;
    return [
      {
        id: f.id,
        title: f.title,
        unit,
        loc: locOf(unit),
        type,
        programId: p.id,
        program: p.short,
        uploadedAt: f.created_at,
        by: f.profiles ? personName(f.profiles) : "—",
        from: f.valid_from,
        to: f.valid_until,
        status: f.cert_status,
        levelCode: f.accreditation_levels?.code ?? null,
        deletedAt: f.is_archived ? (f.archived_at ?? f.created_at) : null,
      },
    ];
  });

  return {
    units,
    programs: progs,
    files: out.filter((f) => !f.deletedAt),
    deleted: out.filter((f) => f.deletedAt).sort((a, b) => b.deletedAt!.localeCompare(a.deletedAt!)),
    folderIds,
  };
}
