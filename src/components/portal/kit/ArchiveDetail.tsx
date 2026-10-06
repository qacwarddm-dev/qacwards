"use client";

import { bullets, describeMean, type ArchiveDetail as Detail, type ArchiveEntry, type ArchiveFile, type ArchiveIssue } from "@/lib/archive-model";
import { areaLabel, shortDate } from "@/lib/program-names";
import BackLink from "./BackLink";
import Bar from "./Bar";
import Btn from "./Btn";
import Card, { CardHead } from "./Card";
import Crumbs from "./Crumbs";
import Pill from "./Pill";
import SumRows from "./SumRows";

const range = (e: ArchiveEntry) => (e.from && e.to ? `${shortDate(e.from)} – ${shortDate(e.to)}` : "—");

export default function ArchiveDetail({
  entry,
  detail,
  own,
  onBack,
  onCompare,
  onView,
}: {
  entry: ArchiveEntry;
  detail: Detail | null;
  own?: boolean;
  onBack: () => void;
  onCompare: (i: ArchiveIssue) => void;
  onView: (f: ArchiveFile) => void;
}) {
  const reports = detail?.reports ?? [];
  const means = reports.map((r) => r.grandMean).filter((m): m is number => m !== null);
  const reviewed = reports.map((r) => r.reviewedAt).filter((d): d is string => Boolean(d)).sort().at(-1) ?? null;
  const strengths = reports.flatMap((r) => bullets(r.findings));
  const recs = reports.flatMap((r) => bullets(r.recommendation));
  const mean = entry.grandMean;
  const timeline: [string, string | null, string][] = [
    ["Scheduled & assigned", entry.assignedAt, entry.accreditors.length ? `${entry.accreditors.join(" and ")} accepted` : "Accreditors accepted"],
    ["Documents accepted", entry.documentsAcceptedAt, `${entry.issues.length} returned and fixed`],
    ["QAC review", reviewed, means.length ? `Signed reports acknowledged · grand means ${means.map((m) => m.toFixed(2)).join(" and ")}` : "Signed reports acknowledged"],
    ["Accreditation result", entry.evaluatedAt, entry.passed ? entry.status : "Deferred · re-survey needed"],
  ];

  return (
    <>
      <Crumbs items={[{ label: "Accreditation Archive", onClick: onBack }, { label: `${entry.short} · ${entry.level}` }]} />
      <Card>
        <CardHead title={entry.program} sub={`${own ? "" : `${entry.collegeName} · `}${entry.campus} · ${entry.cycle}`} right={<BackLink to="Archive" onClick={onBack} />} />
        <SumRows
          four
          rows={[
            ["Level", entry.level],
            ["Survey visit", entry.visit ?? "—"],
            ["Result", <b key="r"><Pill tone={entry.passed ? "ok" : "ret"}>{entry.passed ? "Passed" : "Deferred"}</Pill></b>],
            ["Status on certificate", entry.passed ? entry.status : "—"],
            ["Internal accreditors", entry.accreditors.join(" · ") || "—"],
            ["Grand mean", mean === null ? "—" : `${mean.toFixed(2)} · ${describeMean(mean)}`],
            ["Valid", range(entry)],
            ["Issues resolved", entry.issues.length],
          ]}
        />
      </Card>

      <Card>
        <h3 className="h3s" style={{ marginTop: 0 }}>How it went</h3>
        <div className="arch-tline">
          {timeline.map(([t, d, s], i) => {
            const bad = !entry.passed && i === 3;
            return (
              <div key={t} className={bad ? "arch-tl bad" : "arch-tl"}>
                <i>{bad ? "!" : "✓"}</i>
                <div>
                  <b>{t}</b>
                  <small>{d ? shortDate(d) : "—"}</small>
                  <span>{s}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHead title="What the accreditors flagged and how it was resolved" sub="From the document reviews and version history of this accreditation" />
        {entry.issues.length ? (
          <div className="tscroll">
            <table className="arch-tb">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Accreditor flagged</th>
                  <th>{own ? "What you changed" : "What the program changed"}</th>
                  <th>Documents prepared</th>
                  <th>Resolution</th>
                </tr>
              </thead>
              <tbody>
                {entry.issues.map((x) => (
                  <tr key={x.finalDocId}>
                    <td><b style={{ fontWeight: 600 }}>{x.area}</b></td>
                    <td>
                      {x.flag}
                      <small>{x.flaggedBy}</small>
                    </td>
                    <td>
                      {x.change}
                      <small>
                        <a className="lnk" role="button" tabIndex={0} onClick={() => onCompare(x)}>
                          Compare v1 and v{x.version}
                        </a>
                      </small>
                    </td>
                    <td>{x.docs}</td>
                    <td>
                      <Pill tone="ok">Accepted</Pill>
                      <small>{shortDate(x.resolvedAt)}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="sub">No document was returned during this accreditation.</div>
        )}
      </Card>

      <div className="arch-two">
        <Card>
          <h3 className="h3s" style={{ marginTop: 0 }}>Area ratings</h3>
          {detail?.ratings.length ? (
            <div className="arch-rat">
              {detail.ratings.map((r) => (
                <div key={r.areaId}>
                  <span>{areaLabel(r.name)}</span>
                  <Bar pct={Math.round((r.mean / 5) * 100)} color={r.mean < 3 ? "var(--red)" : r.mean < 3.5 ? "var(--gold)" : "var(--green)"} />
                  <b>{r.mean.toFixed(2)}</b>
                </div>
              ))}
            </div>
          ) : (
            <div className="sub">No area ratings were recorded.</div>
          )}
        </Card>
        <Card>
          <h3 className="h3s" style={{ marginTop: 0 }}>Summary of findings</h3>
          <b style={{ fontSize: 12.5 }}>Strengths</b>
          <ul className="arch-ul">{strengths.length ? strengths.map((s, i) => <li key={i}>{s}</li>) : <li>None recorded</li>}</ul>
          <b style={{ fontSize: 12.5 }}>Recommendations</b>
          <ul className="arch-ul">{recs.length ? recs.map((s, i) => <li key={i}>{s}</li>) : <li>None recorded</li>}</ul>
          <h3 className="h3s">Files</h3>
          {entry.files.length ? (
            entry.files.map((f) => (
              <div key={f.id} className="arch-file">
                <span className="pdfi">PDF</span>
                <div>
                  <b>{f.title}</b>
                  <small>{f.kind} · view only</small>
                </div>
                <Btn variant="gh" sm onClick={() => onView(f)}>View</Btn>
              </div>
            ))
          ) : (
            <div className="sub">No certificate or summary of findings has been filed for this accreditation yet.</div>
          )}
        </Card>
      </div>
    </>
  );
}
