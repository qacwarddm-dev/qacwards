"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import useBusy from "../../kit/useBusy";
import Btn from "../../kit/Btn";
import Card, { CardHead } from "../../kit/Card";
import Letterhead from "../../kit/Letterhead";
import Modal from "../../kit/Modal";
import SearchBox from "../../kit/SearchBox";
import ValidityWatch, { type WatchPreset } from "../../kit/ValidityWatch";
import { printPaper } from "../../kit/printPaper";
import { useToast } from "../../kit/ToastProvider";
import { LVS, type QacProgram } from "@/lib/qac-model";
import {
  RTYPES,
  csvName,
  reportCsv,
  reportData,
  reportScope,
  type CatalogProgram,
  type ReportData,
  type ReportFilters,
  type ReportType,
  type SavedReport,
} from "@/lib/report-model";
import { deleteReport, saveReport } from "@/lib/report-actions";
import { downloadReportPdf } from "@/lib/report-pdf";
import { shortDate } from "@/lib/program-names";
import { validityWatch } from "@/lib/validity-model";

type Draft = { type: ReportType; filters: ReportFilters; title: string; scope: string; by: string; date: string; id?: string };

export default function QacReports({
  programs,
  catalog,
  saved,
  colleges,
  today,
  me,
  initialNew,
}: {
  programs: QacProgram[];
  catalog: CatalogProgram[];
  saved: SavedReport[];
  colleges: [string, string][];
  today: string;
  me: string;
  initialNew: ReportType | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [, start] = useBusy();
  const [q, setQ] = useState("");
  const [year, setYear] = useState("all");
  const [type, setType] = useState("all");
  const [form, setForm] = useState<{ type: ReportType; preset?: WatchPreset } | null>(initialNew ? { type: initialNew } : null);
  const [preview, setPreview] = useState<Draft | null>(null);

  const watch = useMemo(() => validityWatch(programs, today), [programs, today]);
  const years = [...new Set([today.slice(0, 4), ...saved.map((r) => r.date.slice(0, 4))])].sort().reverse();

  const ql = q.toLowerCase();
  const rows = saved.filter(
    (r) => (year === "all" || r.date.startsWith(year)) && (type === "all" || r.type === type) && (!ql || `${r.title}${r.scope}${r.by}`.toLowerCase().includes(ql)),
  );

  const csvData = (r: { type: ReportType; filters: ReportFilters }) => reportData(r.type, r.filters, programs, catalog);
  const csvOf = (r: { type: ReportType; filters: ReportFilters }) => reportCsv(csvData(r));
  const pdf = (r: Draft, d: ReportData) => downloadReportPdf({ title: r.title, scope: r.scope, asOf: shortDate(r.date), by: r.by }, d, toast.say);

  const remove = (id: string) =>
    start(async () => {
      const r = await deleteReport(id);
      if (!r.ok) return toast.say(r.error, true);
      toast.say("Report deleted");
      router.refresh();
    });

  return (
    <>
      {(watch.soon.length > 0 || watch.expired.length > 0 || watch.valid.length > 0) && (
        <ValidityWatch watch={watch} today={today} onGenerate={(preset) => setForm({ type: "expired", preset })} />
      )}
      <Card>
        <CardHead title="Generate a report" sub="Choose a report type" />
        <div className="rtypes">
          {(Object.entries(RTYPES) as [ReportType, [string, string, string]][]).map(([k, t]) => (
            <div key={k} className="rty" role="button" tabIndex={0} onClick={() => setForm({ type: k })} onKeyDown={(e) => e.key === "Enter" && setForm({ type: k })}>
              <span className="i">{t[2]}</span>
              <div>
                <b>{t[0]}</b>
                <small>{t[1]}</small>
              </div>
              <span className="chev">›</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardHead
          title="Generated reports"
          right={
            <div className="ftools">
              <SearchBox value={q} onChange={setQ} placeholder="Search reports" />
              <label className="fl">Year</label>
              <select className="inp" value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="all">All</option>
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
              <label className="fl">Type</label>
              <select className="inp" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="all">All</option>
                {Object.entries(RTYPES).map(([k, t]) => (
                  <option key={k} value={k}>
                    {t[0]}
                  </option>
                ))}
              </select>
            </div>
          }
        />
        {rows.length ? (
          <div className="tscroll">
            <table>
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Scope</th>
                  <th>Generated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="click" onClick={() => setPreview({ ...r, date: r.filters.asOf })}>
                    <td>
                      <span className="rti">{RTYPES[r.type][2]}</span> <b style={{ fontWeight: 600 }}>{r.title}</b>
                    </td>
                    <td>{r.scope}</td>
                    <td>
                      {shortDate(r.date)}
                      <small>{r.by}</small>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                      <Btn variant="o" sm onClick={() => setPreview({ ...r, date: r.filters.asOf })}>
                        View
                      </Btn>{" "}
                      <Btn variant="gh" sm onClick={() => pdf({ ...r, date: r.filters.asOf }, csvData(r))}>
                        ⬇ PDF
                      </Btn>{" "}
                      <Btn variant="gh" sm href={csvOf(r)} download={csvName(r.title)} onClick={() => toast.say("CSV downloaded")}>
                        ⬇ CSV
                      </Btn>{" "}
                      <Btn variant="gh" sm title="Delete" onClick={() => remove(r.id)}>
                        🗑
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <div className="big">🗂️</div>
            {saved.length ? "No reports match your filters." : "No reports generated yet."}
          </div>
        )}
      </Card>
      {form && (
        <NewReportModal
          type={form.type}
          preset={form.preset}
          campuses={[...new Set(catalog.map((p) => p.campus))].sort()}
          colleges={colleges}
          today={today}
          onClose={() => setForm(null)}
          onPreview={(t, f) => {
            setForm(null);
            setPreview({ type: t, filters: f, title: `${RTYPES[t][0]} Report`, scope: reportScope(f), by: me, date: f.asOf });
          }}
        />
      )}
      {preview && (
        <PreviewModal
          r={preview}
          programs={programs}
          catalog={catalog}
          onClose={() => setPreview(null)}
          onSaved={() => {
            setPreview(null);
            setQ("");
            setYear("all");
            setType("all");
          }}
        />
      )}
    </>
  );
}

function NewReportModal({
  type,
  preset,
  campuses,
  colleges,
  today,
  onClose,
  onPreview,
}: {
  type: ReportType;
  preset?: WatchPreset;
  campuses: string[];
  colleges: [string, string][];
  today: string;
  onClose: () => void;
  onPreview: (t: ReportType, f: ReportFilters) => void;
}) {
  const [t, setT] = useState(type);
  const [f, setF] = useState<ReportFilters>({ camp: preset?.camp ?? "all", col: "all", lv: preset?.lv ?? "all", asOf: today });
  const set = (k: keyof ReportFilters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal
      title="New report"
      sub="Set the filters, then preview"
      onClose={onClose}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn onClick={() => onPreview(t, f)}>Preview report ›</Btn>
        </>
      }
    >
      <label className="fl">Report type</label>
      <select className="inp" value={t} onChange={(e) => setT(e.target.value as ReportType)}>
        {Object.entries(RTYPES).map(([k, x]) => (
          <option key={k} value={k}>
            {x[0]}
          </option>
        ))}
      </select>
      <div className="fg2">
        <div>
          <label className="fl">Campus</label>
          <select className="inp" value={f.camp} onChange={set("camp")}>
            <option value="all">All campuses</option>
            {campuses.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="fl">College</label>
          <select className="inp" value={f.col} onChange={set("col")}>
            <option value="all">All colleges</option>
            {colleges.map(([c, n]) => (
              <option key={c} value={c}>
                {c} · {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="fl">Level</label>
          <select className="inp" value={f.lv} onChange={set("lv")}>
            <option value="all">All levels</option>
            {LVS.map((l) => (
              <option key={l[0]} value={l[0]}>
                {l[2]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="fl">As of</label>
          <input className="inp" type="date" value={f.asOf} onChange={set("asOf")} />
        </div>
      </div>
    </Modal>
  );
}

function PreviewModal({
  r,
  programs,
  catalog,
  onClose,
  onSaved,
}: {
  r: Draft;
  programs: QacProgram[];
  catalog: CatalogProgram[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, start] = useBusy();
  const paper = useRef<HTMLDivElement>(null);
  const d = useMemo(() => reportData(r.type, r.filters, programs, catalog), [r, programs, catalog]);

  const save = () =>
    start(async () => {
      const res = await saveReport(r.type, r.filters);
      if (!res.ok) return toast.say(res.error, true);
      toast.say("Report saved");
      onSaved();
      router.refresh();
    });

  return (
    <Modal
      size="wide"
      title={r.title}
      sub={r.scope}
      onClose={onClose}
      bodyStyle={{ background: "#e9e9e9" }}
      footer={
        <>
          <Btn variant="gh" href={reportCsv(d)} download={csvName(r.title)} onClick={() => toast.say("CSV downloaded")}>
            ⬇ CSV (Excel)
          </Btn>
          <Btn variant="o" onClick={() => downloadReportPdf({ title: r.title, scope: r.scope, asOf: shortDate(r.date), by: r.by }, d, toast.say)}>
            ⬇ Download PDF
          </Btn>
          <Btn variant="gh" onClick={() => printPaper(paper.current, () => toast.say("Printing is blocked in this preview", true))}>
            🖨 Print
          </Btn>
          {r.id ? (
            <Btn onClick={onClose}>Close</Btn>
          ) : (
            <Btn disabled={busy} onClick={save}>
              Save report
            </Btn>
          )}
        </>
      }
    >
      <div className="paper" ref={paper}>
        <Letterhead />
        <div className="dtt">{r.title.toUpperCase()}</div>
        <div className="dst2">
          {r.scope} · as of {shortDate(r.date)}
        </div>
        <div className="rsum">{d.sum}</div>
        <table className="rt c sm">
          <tbody>
            <tr>
              {d.h.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
            {d.rows.length ? (
              d.rows.map((x, i) => (
                <tr key={i}>
                  {x.map((v, j) => (
                    <td key={j} style={j ? undefined : { textAlign: "left" }} className={v === "Expired" ? "bad" : v === "Expiring" ? "warn" : undefined}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={d.h.length}>No programs match these filters.</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="pfoot2">Generated by {r.by} · QAC-WARDS · Form Code: QAC-TPL-01</div>
      </div>
    </Modal>
  );
}
