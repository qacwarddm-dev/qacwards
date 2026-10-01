import { createClient } from "@/lib/supabase/server";
import { personName, programShort } from "@/lib/program-names";

export type DeletedItem = { id: string; title: string; sub: string; deletedAt: string };
export type RecentlyDeletedData = { files: DeletedItem[]; docs: DeletedItem[]; programs: DeletedItem[] | null; users: DeletedItem[] | null };

export async function getRecentlyDeleted(isAdmin: boolean): Promise<RecentlyDeletedData> {
  const supabase = await createClient();
  const [{ data: files }, { data: docs }, { data: programs }, { data: users }] = await Promise.all([
    supabase
      .from("repository_files")
      .select("id, title, created_at, archived_at, programs(name), repository_folders(name)")
      .eq("is_archived", true)
      .order("archived_at", { ascending: false, nullsFirst: false }),
    supabase.from("common_documents").select("id, title, category, deleted_at").not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
    isAdmin
      ? supabase.from("programs").select("id, name, deleted_at, campuses(name), colleges(code)").not("deleted_at", "is", null).order("deleted_at", { ascending: false })
      : Promise.resolve({ data: null }),
    isAdmin
      ? supabase.from("profiles").select("id, surname, given_name, middle_initial, role, webmail, deleted_at").not("deleted_at", "is", null).order("deleted_at", { ascending: false })
      : Promise.resolve({ data: null }),
  ]);
  return {
    files: (files ?? []).map((f) => ({
      id: f.id,
      title: f.title,
      sub: [f.programs ? programShort(f.programs.name) : null, f.repository_folders?.name].filter(Boolean).join(" · "),
      deletedAt: f.archived_at ?? f.created_at,
    })),
    docs: (docs ?? []).map((d) => ({ id: d.id, title: d.title, sub: d.category, deletedAt: d.deleted_at! })),
    programs: programs
      ? programs.map((p) => ({ id: p.id, title: p.name, sub: [p.colleges?.code, p.campuses?.name].filter(Boolean).join(" · "), deletedAt: p.deleted_at! }))
      : null,
    users: users ? users.map((u) => ({ id: u.id, title: personName(u), sub: `${u.webmail} · ${u.role.replace(/_/g, " ")}`, deletedAt: u.deleted_at! })) : null,
  };
}
