const SMALL = new Set(["of", "in", "and", "the", "major", "for", "&", "with"]);

/** "Bachelor of Science in Information Technology" → "BS Information Technology". */
export function programMid(name: string): string {
  return name
    .replace(/^Bachelor of Science in /, "BS ")
    .replace(/^Bachelor of Arts in /, "AB ")
    .replace(/^Bachelor of Secondary Education/, "BSEd")
    .replace(/^Bachelor of Elementary Education/, "BEEd")
    .replace(/^Bachelor of /, "B ")
    .replace(/^Master of Science in /, "MS ")
    .replace(/^Master of Arts in /, "MA ")
    .replace(/^Doctor of Philosophy in /, "PhD ");
}

/** "Bachelor of Science in Information Technology" → "BSIT";
 *  "...Business Administration major in Marketing Management" → "BSBA-MM". */
export function programShort(name: string): string {
  const [main, major] = name.split(/ major in /i);
  const initials = (s: string) =>
    s
      .split(/\s+/)
      .filter((w) => w && !SMALL.has(w.toLowerCase()))
      .map((w) => w[0].toUpperCase())
      .join("");
  let head: string;
  const m = main.match(/^(Bachelor|Master|Doctor) of (Science|Arts)(?: in (.+))?$/i);
  if (m) {
    const deg = m[1][0].toUpperCase() + (m[2][0].toUpperCase() === "S" ? "S" : "A");
    head = deg + (m[3] ? initials(m[3]) : "");
    if (m[1].toLowerCase() === "bachelor" && m[2].toLowerCase() === "arts") head = "AB" + (m[3] ? initials(m[3]) : "");
  } else {
    head = initials(main.replace(/^Bachelor (of )?/i, "B "));
  }
  return major ? `${head}-${initials(major)}` : head;
}

/** DB area names mix "AREA V - Research" and "Area I - VMGO"; the screens want
 *  "Area V – Research". */
export function areaLabel(name: string): string {
  return name.replace(/^AREA /, "Area ").replace(/ - /g, " – ");
}

export function areaShort(name: string): string {
  const parts = areaLabel(name).split(" – ");
  return parts.length > 1 ? parts.slice(1).join(" – ") : name;
}

export function phaseLabel(ordinal: number, name: string): string {
  return `Phase ${ordinal} – ${name}`;
}

export const LEVEL_SHORT: Record<string, string> = {
  PSV: "PSV",
  I: "LEVEL I",
  II: "LEVEL II",
  III: "LEVEL III",
  IV: "LEVEL IV",
};

export function personName(p: { surname: string; given_name: string; middle_initial?: string | null } | null | undefined): string {
  if (!p) return "—";
  return `${p.surname}, ${p.given_name}${p.middle_initial ? ` ${p.middle_initial}` : ""}`;
}

export function initialsOf(name: string): string {
  const [sur, given] = name.split(",").map((s) => s.trim());
  if (!given) return name.slice(0, 2).toUpperCase();
  return `${given[0] ?? ""}${sur[0] ?? ""}`.toUpperCase();
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Calendar date in Asia/Manila, "Sep 8, 2026". */
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00+08:00` : iso);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return `${MON[get("month") - 1]} ${get("day")}, ${get("year")}`;
}

export function manilaTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

/** "YYYY-MM-DD" in Asia/Manila. */
export function manilaDay(iso: string | Date = new Date()): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(d);
}

export function fileSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
