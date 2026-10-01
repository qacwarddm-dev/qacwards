import Letterhead from "./Letterhead";
import { describeMean } from "@/lib/review-model";

export type ReportRow = { roman: string; title: string; mean: number };

export type ReportSigner = {
  name: string;
  role: string;
  signatureUrl?: string | null;
  signedAt?: string | null;
  pending?: string;
};

export type ReportData = {
  program: string;
  collegeCampus: string;
  levelName: string;
  visitLabel: string;
  accreditor: string;
  evaluatedOn: string | null;
  rows: ReportRow[];
  improvements: { roman: string; remarks: string[] }[];
  findings: string;
  recommendation: string;
  signers: ReportSigner[];
  docId?: string | null;
  signedFull?: string | null;
};

const ROM = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
export const roman = (n: number) => ROM[n - 1] ?? String(n);

function Qr() {
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      const fin = (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3);
      const on = fin ? !(r % 2 === 1 && c % 3 === 1) : (r * 7 + c * 3) % 3 === 0;
      cells.push(<i key={`${r}${c}`} className={on ? "" : "w"} />);
    }
  return <div className="qr">{cells}</div>;
}

function Sig({ url }: { url?: string | null }) {
  if (url) return <img src={url} alt="" style={{ maxWidth: 150, maxHeight: 50 }} />;
  return (
    <svg width="150" height="50" viewBox="0 0 150 50" aria-hidden>
      <path
        d="M6 36c8-18 14-26 18-24s-6 22-2 24 10-18 16-18-4 16 2 17 8-12 12-12 0 10 4 10 6-8 10-8-2 8 3 8 6-6 10-6M70 30c6-2 12-10 18-10s-4 12 2 12 10-14 16-14 0 12 6 12c5 0 9-6 14-8"
        fill="none"
        stroke="#1f3a7a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 42c40-4 90-5 136-7" fill="none" stroke="#1f3a7a" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** The Internal Accreditor's Evaluation Report on the official PUP letterhead. */
export default function EvaluationReport({ d, variant = "ia" }: { d: ReportData; variant?: "ia" | "qac" }) {
  const gm = d.rows.length ? d.rows.reduce((s, r) => s + r.mean, 0) / d.rows.length : 0;
  const signed = Boolean(d.docId);

  if (variant === "qac")
    return (
      <div className="paper">
        <Letterhead />
        <div className="dtt">INTERNAL ACCREDITOR’S EVALUATION REPORT</div>
        <div className="dst2">
          {d.levelName} · {d.visitLabel}
        </div>
        <table className="rt">
          <tbody>
            <tr>
              <td className="k">Program</td>
              <td>{d.program}</td>
            </tr>
            <tr>
              <td className="k">College / Campus</td>
              <td>{d.collegeCampus}</td>
            </tr>
            <tr>
              <td className="k">Internal Accreditor</td>
              <td>{d.accreditor}</td>
            </tr>
          </tbody>
        </table>
        <div className="sec2">I. Summary of Ratings</div>
        <table className="rt c">
          <tbody>
            <tr>
              <th>Area</th>
              <th>Title</th>
              <th>Mean</th>
              <th>Description</th>
            </tr>
            {d.rows.map((r) => (
              <tr key={r.roman}>
                <td>{r.roman}</td>
                <td style={{ textAlign: "left" }}>{r.title}</td>
                <td>{r.mean.toFixed(2)}</td>
                <td>{describeMean(r.mean)}</td>
              </tr>
            ))}
            <tr className="tot">
              <td colSpan={2} style={{ textAlign: "right" }}>
                GRAND MEAN
              </td>
              <td>{gm.toFixed(2)}</td>
              <td>{describeMean(gm)}</td>
            </tr>
          </tbody>
        </table>
        <div className="sec2">II. Overall Findings</div>
        <p>{d.findings || "—"}</p>
        <div className="sec2">III. Recommendation</div>
        <p>{d.recommendation || "—"}</p>
        <div className="sg1">
          <Sig url={d.signers[0]?.signatureUrl} />
          <div>{d.accreditor.toUpperCase()}</div>
          <small>Internal Accreditor · ✓ Signed electronically {d.evaluatedOn}</small>
          {d.docId && <small>Document ID {d.docId}</small>}
        </div>
      </div>
    );

  return (
    <div className="paper">
      {!signed && <div className="draft">DRAFT</div>}
      <div className="rph">
        <img src="/assets/portal/mockup/ia-seal.jpg" alt="" />
        <div className="t">
          <small>REPUBLIC OF THE PHILIPPINES</small>
          <b>Polytechnic University of the Philippines</b>
          <strong>OFFICE OF THE PRESIDENT</strong>
        </div>
        <img className="bp" src="/assets/portal/mockup/bagong-pilipinas.jpg" alt="" />
      </div>
      <div className="doc-title">INTERNAL ACCREDITOR’S EVALUATION REPORT</div>
      <div className="doc-sub">{d.levelName}</div>
      <table className="info">
        <tbody>
          <tr>
            <td className="k">Program</td>
            <td>{d.program}</td>
          </tr>
          <tr>
            <td className="k">College / Campus</td>
            <td>{d.collegeCampus}</td>
          </tr>
          <tr>
            <td className="k">Accreditation Level</td>
            <td>
              {d.levelName} ({d.visitLabel})
            </td>
          </tr>
          <tr>
            <td className="k">Internal Accreditor</td>
            <td>{d.accreditor}</td>
          </tr>
          <tr>
            <td className="k">Date of Evaluation</td>
            <td>{d.evaluatedOn ?? "—"}</td>
          </tr>
        </tbody>
      </table>
      <div className="sec">I. Summary of Ratings</div>
      <table className="rt">
        <tbody>
          <tr>
            <th style={{ width: 44 }}>Area</th>
            <th>Title</th>
            <th style={{ width: 70 }}>Mean Rating</th>
            <th style={{ width: 110 }}>Description</th>
          </tr>
          {d.rows.map((r) => (
            <tr key={r.roman}>
              <td className="c">{r.roman}</td>
              <td>{r.title}</td>
              <td className="c">{r.mean.toFixed(2)}</td>
              <td className="c">{describeMean(r.mean)}</td>
            </tr>
          ))}
          <tr className="tot">
            <td colSpan={2} style={{ textAlign: "right" }}>
              GRAND MEAN
            </td>
            <td className="c">{gm.toFixed(2)}</td>
            <td className="c">{describeMean(gm)}</td>
          </tr>
        </tbody>
      </table>
      <div className="sec">II. Areas Needing Improvement</div>
      {d.improvements.length ? (
        <ul>
          {d.improvements.map((i) => (
            <li key={i.roman}>
              <b>Area {i.roman}:</b> {i.remarks.join(" ")}
            </li>
          ))}
        </ul>
      ) : (
        <p>None noted.</p>
      )}
      <div className="sec">III. Overall Findings</div>
      <p>{d.findings || <i style={{ color: "#999" }}>(Overall findings from Step 1)</i>}</p>
      <div className="sec">IV. Recommendation</div>
      <p>{d.recommendation}</p>
      <div className="sigs">
        {d.signers.map((s) => (
          <div key={s.name} className={`sg${s.signedAt ? "" : " pend"}`}>
            <div className="img">{s.signedAt ? <Sig url={s.signatureUrl} /> : s.pending}</div>
            <div className="ln">{s.name.toUpperCase()}</div>
            <small>{s.role}</small>
            {s.signedAt && <div className="ts">✓ Signed electronically {s.signedAt}</div>}
          </div>
        ))}
      </div>
      {d.docId && (
        <div className="verify">
          <Qr />
          <div>
            <b>Document ID:</b> {d.docId}
            <br />
            Signed {d.signedFull} by {d.accreditor}
            <br />
            Verify at qacwards.vercel.app/verify/{d.docId}
          </div>
        </div>
      )}
      <div className="pf">
        <div className="addr">
          PUP A. Mabini Campus, Anonas Street, Sta. Mesa, Manila 1016
          <br />
          Trunk Line: 5335-1787 or 5335-1777
          <br />
          Website: www.pup.edu.ph | Inquiries: https://bit.ly/PUPSINTA
          <b>
            A Leading Comprehensive
            <br />
            Polytechnic University in Asia
          </b>
          <span style={{ color: "#888" }}>Form Code: QAC-TPL-01</span>
        </div>
        <img src="/assets/portal/mockup/report-footer.jpg" alt="" />
      </div>
    </div>
  );
}
