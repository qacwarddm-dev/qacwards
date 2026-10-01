export type CalType = "dead" | "visit" | "meet" | "hol";

export type CalEvent = {
  id: string;
  title: string;
  type: CalType;
  start: string;
  end?: string;
  time: string;
  where: string;
  prog: string;
  part: string;
  href?: string;
  removable?: boolean;
};

export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const TC: Record<CalType, [string, string, string, string]> = {
  dead: ["#800000", "#fdecec", "Deadline", "⏰"],
  visit: ["#d49b00", "#fff6d6", "Visit", "🏛"],
  meet: ["#1f4fa3", "#e8eefb", "Meeting", "👥"],
  hol: ["#2b8a8a", "#e3f4f4", "Holiday", "🎌"],
};

export const UCOL: Record<CalType, [string, string, string]> = {
  dead: ["#f7cdcd", "Deadline", "#8f1d1d"],
  visit: ["#fbe6a8", "Visit", "#735600"],
  meet: ["#cfdcf6", "Meeting", "#1f3f8a"],
  hol: ["#c8eae6", "Holiday", "#1e6b64"],
};

export function parseDay(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const fmt = (d: Date) => `${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

export const daysBetween = (from: Date, to: Date) => Math.round((to.getTime() - from.getTime()) / 864e5);

export const cdTxt = (n: number) =>
  n < 0 ? `${-n} day${n === -1 ? "" : "s"} ago` : n === 0 ? "Today" : n === 1 ? "Tomorrow" : `in ${n} days`;

export const evStart = (e: CalEvent) => parseDay(e.start);
export const evEnd = (e: CalEvent) => parseDay(e.end ?? e.start);

export function evStatus(e: CalEvent, today: Date): "Upcoming" | "Ongoing" | "Completed" {
  return evEnd(e) < today ? "Completed" : evStart(e) <= today ? "Ongoing" : "Upcoming";
}

export function evOn(events: CalEvent[], d: Date) {
  return events.filter((e) => d >= evStart(e) && d <= evEnd(e));
}

export function rangeLabel(e: CalEvent, withYear = false) {
  const s = evStart(e);
  if (!e.end || e.end === e.start) return fmt(s);
  const t = evEnd(e);
  const base = s.getMonth() === t.getMonth() ? `${MON[s.getMonth()]} ${s.getDate()}–${t.getDate()}` : `${MON[s.getMonth()]} ${s.getDate()} – ${MON[t.getMonth()]} ${t.getDate()}`;
  return withYear ? `${base}, ${t.getFullYear()}` : base;
}

export function icsHref(e: CalEvent) {
  const f = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const end = evEnd(e);
  end.setDate(end.getDate() + 1);
  const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//QAC-WARDS//EN\r\nBEGIN:VEVENT\r\nUID:${e.id}@qacwards\r\nDTSTART;VALUE=DATE:${f(evStart(e))}\r\nDTEND;VALUE=DATE:${f(end)}\r\nSUMMARY:${e.title}\r\nLOCATION:${e.where}\r\nDESCRIPTION:${e.prog} · ${e.time}\r\nEND:VEVENT\r\nEND:VCALENDAR`;
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
}

export function nextDeadline(events: CalEvent[], today: string) {
  const t = parseDay(today);
  return events.filter((e) => e.type === "dead" && evStart(e) >= t).sort((a, b) => a.start.localeCompare(b.start))[0] ?? null;
}

export function daysUntil(e: CalEvent, today: string) {
  return daysBetween(parseDay(today), evStart(e));
}

export const COLLEGE_COLOR: Record<string, string> = {
  CAF: "#1d7a35",
  CADBE: "#6b3fa0",
  CAL: "#b45309",
  CBA: "#1f4fa3",
  CCIS: "#0e7490",
  COC: "#0369a1",
  COED: "#9f1239",
  CE: "#7c2d12",
  CHK: "#15803d",
  CPSPA: "#b91c1c",
  CS: "#4d7c0f",
  CSSD: "#9d174d",
  CTHTM: "#a16207",
  GS: "#166534",
};
