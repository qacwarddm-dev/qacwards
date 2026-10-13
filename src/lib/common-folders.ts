export type FolderNode = { id: string; name: string; parentId: string | null };

export const childrenOf = <F extends FolderNode>(all: F[], parent: string | null) => all.filter((f) => f.parentId === parent);

export function trailOf<F extends FolderNode>(all: F[], id: string | null): F[] {
  const out: F[] = [];
  const seen = new Set<string>();
  for (let cur = all.find((f) => f.id === id); cur && !seen.has(cur.id); cur = all.find((f) => f.id === cur!.parentId)) {
    seen.add(cur.id);
    out.unshift(cur);
  }
  return out;
}

export function subtreeIds(all: FolderNode[], id: string): Set<string> {
  const ids = new Set([id]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const f of all) if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) ids.add(f.id), (grew = true);
  }
  return ids;
}

export const folderLabel = (all: FolderNode[], id: string) =>
  trailOf(all, id)
    .map((f) => f.name)
    .join(" › ");

export const folderOptions = <F extends FolderNode>(all: F[]) => all.map((f) => ({ id: f.id, label: folderLabel(all, f.id) })).sort((a, b) => a.label.localeCompare(b.label));
