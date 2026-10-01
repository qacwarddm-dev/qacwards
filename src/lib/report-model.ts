import { allPhaseSlots, countSlots } from "@/lib/review-model";
import { LVS, daysTo, levelName, qacStatus, type QacProgram } from "@/lib/qac-model";
import { shortDate } from "@/lib/program-names";

export type ReportType = "copc" | "valid" | "expired" | "level" | "eval" | "ext";

export const RTYPES: Record<ReportType, [string, string, string]> = {
  copc: ["COPC Status", "Programs with and without a CHED Certificate of Program Compliance", "✅"],
  valid: ["Accreditation Validity", "Valid-until date and days left for every accredited program", "📅"],
  expired: ["Expired & Expiring Accreditation", "Programs already expired or ending within 6 months", "⚠"],
  level: ["Programs by Accreditation Level", "Count per college and level", "📊"],
  eval: ["Accreditor Evaluation Status", "Ongoing programs, assigned accreditors and report status", "👥"],
  ext: ["Pre-Accreditation Phase Completion", "Approved phase documents per program", "📄"],
};

export const isReportType = (t: unknown): t is ReportType => typeof t === "string" && t in RTYPES;

export type ReportFilters = { camp: string; col: string; lv: string; asOf: string };
export type CatalogProgram = { name: string; college: string; campus: string; copc: boolean };
export type SavedReport = { id: string; type: ReportType; title: string; scope: string; filters: ReportFilters; by: string; date: string };
export type ReportData = { h: string[]; rows: (string | number)[][]; sum: string };

export function reportScope(f: ReportFilters) {
  return [f.camp === "all" ? "All campuses" : f.camp, f.col === "all" ? "All colleges" : f.col, f.lv === "all" ? "All levels" : levelName(f.lv)].join(" · ");
}

export function reportData(type: ReportType, f: ReportFilters, programs: QacProgram[], catalog: CatalogProgram[]): ReportData {
  const today = f.asOf;
  const ok = (p: { campus: string; college: string }) => (f.camp === "all" || p.campus === f.camp) && (f.col === "all" || p.college === f.col);
  const L = programs.filter((p) => ok(p) && (f.lv === "all" || p.levelCode === f.lv));
  const acc = L.filter((p) => !p.inproc && p.to);
  const d = (p: QacProgram) => daysTo(p.to, today);
  const st = (p: QacProgram) => (d(p) < 0 ? "Expired" : d(p) <= 183 ? "Expiring" : "Valid");
  const byTo = (a: QacProgram, b: QacProgram) => (a.to ?? "").localeCompare(b.to ?? "");
  switch (type) {
    case "copc": {
      const C = catalog.filter(ok);
      return {
        h: ["Program", "College", "Campus", "COPC"],
        rows: C.map((p) => [p.name, p.college, p.campus, p.copc ? "With COPC" : "Without COPC"]),
        sum: `${C.filter((p) => p.copc).length} with COPC · ${C.filter((p) => !p.copc).length} without`,
      };
    }
    case "valid":
      return {
        h: ["Program", "Campus", "Level", "Valid from", "Valid until", "Days left", "Status"],
        rows: [...acc].sort(byTo).map((p) => [p.name, p.campus, p.levelName, p.from ? shortDate(p.from) : "—", shortDate(p.to!), d(p), st(p)]),
        sum: `${acc.filter((p) => st(p) === "Valid").length} valid · ${acc.filter((p) => st(p) === "Expiring").length} expiring · ${acc.filter((p) => st(p) === "Expired").length} expired`,
      };
    case "expired": {
      const E = acc.filter((p) => d(p) <= 183).sort(byTo);
      return {
        h: ["Program", "Campus", "Level", "Valid until", "Days left", "Status", "Action"],
        rows: E.map((p) => [p.name, p.campus, p.levelName, shortDate(p.to!), d(p), st(p), d(p) < 0 ? "Schedule re-survey now" : "Start re-survey"]),
        sum: `${E.filter((p) => d(p) < 0).length} expired · ${E.filter((p) => d(p) >= 0).length} expiring within 6 months`,
      };
    }
    case "level": {
      const cols = [...new Set(L.map((p) => p.college))].sort();
      return {
        h: ["College", ...LVS.map((l) => l[1]), "Total"],
        rows: cols.map((c) => [c, ...LVS.map((l) => L.filter((p) => p.college === c && p.levelCode === l[0]).length), L.filter((p) => p.college === c).length]),
        sum: `${L.length} programs`,
      };
    }
    case "eval": {
      const O = L.filter((p) => p.inproc);
      return {
        h: ["Program", "Level", "Visit", "Accreditors", "Reports", "Status"],
        rows: O.map((p) => [
          p.name,
          p.levelName,
          p.visitLabel,
          p.team.filter((m) => m.response !== "rejected").map((m) => m.name).join("; ") || "None",
          `${p.reports.filter((r) => r.status === "submitted" || r.status === "acknowledged").length}/2`,
          qacStatus(p, today).t,
        ]),
        sum: `${O.length} programs in process`,
      };
    }
    case "ext": {
      const O = L.filter((p) => p.inproc && p.review);
      const phases = O[0]?.review?.phases ?? [];
      return {
        h: ["Program", ...phases.map((g) => g.name.split(" – ")[0]), "Approved"],
        rows: O.map((p) => {
          const c = countSlots(allPhaseSlots(p.review!));
          return [
            p.name,
            ...phases.map((_, i) => {
              const x = countSlots(p.review!.phases[i]?.docs ?? []);
              return `${x.ap}/${x.req}`;
            }),
            `${c.req ? Math.round((c.ap / c.req) * 100) : 0}%`,
          ];
        }),
        sum: `${O.length} programs`,
      };
    }
  }
}

export function reportCsv(d: ReportData) {
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return "data:text/csv;charset=utf-8," + encodeURIComponent("﻿" + [d.h, ...d.rows].map((x) => x.map(q).join(",")).join("\r\n"));
}

export const csvName = (title: string) => `${title.replace(/[^\w]+/g, "-")}.csv`;
