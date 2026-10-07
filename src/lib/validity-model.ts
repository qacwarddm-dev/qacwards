import { SOON_DAYS, daysTo, type QacProgram } from "@/lib/qac-model";

export const PAGE = 8;

export type WatchTab = "soon" | "exp";

export type WatchRow = {
  id: string;
  name: string;
  short: string;
  campus: string;
  levelCode: string;
  levelName: string;
  to: string;
  days: number;
};

export type WatchFilters = { camp: string; lv: string; q: string };

export type Watch = { soon: WatchRow[]; expired: WatchRow[]; valid: number };

export function validityWatch(programs: QacProgram[], today: string): Watch {
  const rows = programs
    .filter((p) => !p.inproc && p.to)
    .map<WatchRow>((p) => ({ id: p.id, name: p.name, short: p.short, campus: p.campus, levelCode: p.levelCode, levelName: p.levelName, to: p.to!, days: daysTo(p.to, today) }));
  return {
    soon: rows.filter((r) => r.days >= 0 && r.days <= SOON_DAYS).sort((a, b) => a.to.localeCompare(b.to)),
    expired: rows.filter((r) => r.days < 0).sort((a, b) => b.to.localeCompare(a.to)),
    valid: rows.filter((r) => r.days > SOON_DAYS).length,
  };
}

export function campusCounts(rows: WatchRow[]): [string, number][] {
  const by = new Map<string, number>();
  for (const r of rows) by.set(r.campus, (by.get(r.campus) ?? 0) + 1);
  return [...by].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export function filterWatch(rows: WatchRow[], f: WatchFilters): WatchRow[] {
  const q = f.q.trim().toLowerCase();
  return rows.filter((r) => (f.camp === "all" || r.campus === f.camp) && (f.lv === "all" || r.levelCode === f.lv) && (!q || `${r.name} ${r.short} ${r.campus}`.toLowerCase().includes(q)));
}

export function timeAgo(days: number) {
  const n = -days;
  if (n < 60) return `${n} day${n === 1 ? "" : "s"} ago`;
  const m = Math.round(n / 30.4);
  if (m < 24) return `${m} months ago`;
  return `${(n / 365).toFixed(1).replace(".0", "")} years ago`;
}

export const campusLabel = (campus: string) => campus.split(",")[0];
