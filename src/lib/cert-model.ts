export type CertProgram = { name: string; statuses: [status: string, validity: string][]; visit: string };
export type CertCollege = { code: string; name: string; programs: (CertProgram & { no: number })[] };
export type CertCampus = { name: string; label: string; colleges: CertCollege[] };
export type CertSource = { name: string; label: string; colleges: { code: string; name: string; programs: CertProgram[] }[] };

export type CertFilters = { camp: string; col: string; lv: string };

const MONTHS = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];

const CAMPUS_TITLE: Record<string, string> = {
  Alfonso: "Alfonso, Cavite",
  Bansud: "Bansud, Oriental Mindoro",
  Bataan: "Mariveles, Bataan",
  Biñan: "Biñan, Laguna",
  Cabiao: "Cabiao, Nueva Ecija",
  Calauan: "Calauan, Laguna",
  "General Luna": "General Luna, Quezon",
  Lopez: "Lopez, Quezon",
  Maragondon: "Maragondon, Cavite",
  Mulanay: "Mulanay, Quezon",
  Parañaque: "Parañaque City",
  Pulilan: "Pulilan, Bulacan",
  Ragay: "Ragay, Camarines Sur",
  Sablayan: "Sablayan, Occidental Mindoro",
  "San Juan": "San Juan City",
  "San Pedro": "San Pedro, Laguna",
  "Sta. Maria": "Sta. Maria, Bulacan",
  "Sta. Rosa": "Sta. Rosa, Laguna",
  "Sto. Tomas": "Sto. Tomas, Batangas",
  Taguig: "Taguig City",
  Unisan: "Unisan, Quezon",
};

/** "Sept. 01, 2023", the way the Office of the President's template writes dates. */
export function certDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${MONTHS[m - 1]} ${String(d).padStart(2, "0")}, ${y}`;
}

export const certValidity = (from: string | null, to: string | null) => `${from ? certDate(from) : "—"} – ${to ? certDate(to) : "—"}`;

export const campusTitle = (name: string) => (name === "Sta. Mesa, Manila" ? "Sta. Mesa" : (CAMPUS_TITLE[name] ?? name));

export function campusLabel(name: string, isMain: boolean) {
  return `PUP ${isMain ? name.split(",")[0] : campusTitle(name)} Campus`;
}

export function levelOfStatus(status: string): string {
  return /Candidate/i.test(status) ? "PSV" : /Level IV/i.test(status) ? "IV" : /Level III/i.test(status) ? "III" : /Level II/i.test(status) ? "II" : /Level I/i.test(status) ? "I" : "";
}

export function filterCert(data: CertSource[], f: CertFilters): CertCampus[] {
  let no = 0;
  const out: CertCampus[] = [];
  for (const campus of data) {
    if (f.camp !== "all" && campus.name !== f.camp) continue;
    const colleges: CertCollege[] = [];
    for (const college of campus.colleges) {
      if (f.col !== "all" && college.code !== f.col) continue;
      const programs = college.programs
        .filter((p) => f.lv === "all" || levelOfStatus(p.statuses[p.statuses.length - 1]?.[0] ?? "") === f.lv)
        .map((p) => ({ ...p, no: ++no }));
      if (programs.length) colleges.push({ code: college.code, name: college.name, programs });
    }
    if (colleges.length) out.push({ name: campus.name, label: campus.label, colleges });
  }
  return out;
}

export type CertRow =
  | { kind: "campus"; label: string; continued?: boolean }
  | { kind: "college"; label: string; continued?: boolean }
  | { kind: "program"; program: CertProgram & { no: number } };

const LINES_PER_PAGE = 52;
const HEADING = 1.1;

/** Lays the rows out over US Letter pages, repeating the campus/college heading on a page that starts mid-section. */
export function paginateCert(campuses: CertCampus[]): CertRow[][] {
  type Item = { row: CertRow; units: number; heading: boolean; campus: string; college: string };
  const items: Item[] = [];
  for (const c of campuses) {
    items.push({ row: { kind: "campus", label: c.label }, units: HEADING, heading: true, campus: c.label, college: "" });
    for (const k of c.colleges) {
      const label = k.code ? `${k.name} (${k.code})` : "";
      if (label) items.push({ row: { kind: "college", label }, units: HEADING, heading: true, campus: c.label, college: label });
      for (const p of k.programs) {
        const nameLines = Math.ceil(p.name.length / 52);
        items.push({ row: { kind: "program", program: p }, units: Math.max(p.statuses.length, nameLines) * 1.15 + 0.2, heading: false, campus: c.label, college: label });
      }
    }
  }

  const pages: CertRow[][] = [];
  let page: CertRow[] = [];
  let used = 0;
  items.forEach((item, i) => {
    const keepWithNext = item.heading && items[i + 1] ? items[i + 1].units : 0;
    if (used + item.units + keepWithNext > LINES_PER_PAGE && page.length) {
      pages.push(page);
      page = [];
      used = 0;
      if (!item.heading || item.row.kind === "college") {
        page.push({ kind: "campus", label: item.campus, continued: true });
        used += HEADING;
        if (!item.heading && item.college) {
          page.push({ kind: "college", label: item.college, continued: true });
          used += HEADING;
        }
      }
    }
    page.push(item.row);
    used += item.units;
  });
  if (page.length) pages.push(page);
  return pages;
}

export const CERT_HEADERS = ["No.", "Campus", "College", "Program Name", "Accreditation Status", "Validity of Accreditation", "Latest Date Visit"];

export function certTable(campuses: CertCampus[]) {
  const rows: (string | number)[][] = [];
  let programs = 0;
  for (const c of campuses)
    for (const k of c.colleges)
      for (const p of k.programs) {
        programs++;
        p.statuses.forEach(([status, validity], i) => rows.push([i ? "" : p.no, c.label.replace(/^PUP /, "").replace(/ Campus$/, ""), k.name, i ? "" : p.name, status, validity, i ? "" : p.visit]));
      }
  return { h: CERT_HEADERS, rows, sum: `${programs} programs · ${campuses.length} campus${campuses.length > 1 ? "es" : ""}` };
}
