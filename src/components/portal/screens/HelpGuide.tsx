"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Btn from "../kit/Btn";
import Scope from "../kit/Scope";
import SearchBox from "../kit/SearchBox";
import { useToast } from "../kit/ToastProvider";

type Step = [string, string, string];
type Faq = [string, string, React.ReactNode];

const IA_STEPS: Step[] = [
  ["/portal/assignment", "Accept the assignment", "Assignment → Accept, and confirm no conflict of interest"],
  ["/portal/evaluation", "Rate each area", "Accreditation → program → Area I–X"],
  ["/portal/resubmissions", "Re-check resubmissions", "Items you returned that were uploaded again"],
  ["/portal/evaluation", "Sign & submit", "Review, preview the report, sign with your e-signature"],
];

const IA_FAQ: [string, React.ReactNode][] = [
  ["Why can’t I click Evaluate?", "The program hasn’t uploaded enough documents yet (at least 10%). You’ll get a notification when it’s ready."],
  ["What happens when I return a document for revision?", "The program representative sees your remark on their Feedback page. When they upload a new version, it appears in your Resubmissions list."],
  ["Can I edit my evaluation after signing?", "No. Signed reports are locked. Contact the QA Center if a correction is needed."],
  ["Where does my signature come from?", "From Profile → E-signature. Save it once and it’s used on every report you sign."],
];

const REP_STEPS: Step[] = [
  ["/portal/documents", "View the template", "Documents → Templates → level → area"],
  ["/portal/submission", "Fill out & upload", "Accreditation → program → level → Upload"],
  ["/portal/feedback", "Fix returned files", "Feedback → From Accreditors → Resubmit"],
  ["/portal/events", "Watch deadlines", "Events and the Dashboard countdown"],
];

const REP_FAQ: Faq[] = [
  ["Documents", "Can I download the templates?", <>No. Templates in <b>Documents → Templates</b> are view only. To create the document, open <b>Accreditation → Upload</b>; the blank PUP template is provided there.</>],
  ["Upload", "Why was my file rejected?", "The system only accepts PDFs made from the official PUP template. Scanned files, Word files and files over 25 MB are also rejected."],
  ["Upload", "Can I save and finish later?", <>Yes. Use <b>Save draft</b> in the upload window. Drafts are not submitted until you click Upload.</>],
  ["Feedback", "What does “Needs revision” mean?", <>An internal accreditor asked for changes. Open <b>Feedback → From Accreditors</b> to read the comment, then <b>Resubmit</b> the revised file.</>],
  ["Readiness", "How is the readiness % computed?", "Documents uploaded and not returned (approved + for review) divided by all required documents for that level."],
  ["Evaluations", "Where are the evaluation forms?", <>After each visit they pop up on your Dashboard. You can also find them anytime under <b>Feedback → Your evaluations</b>.</>],
  ["Common Documents", "Why is Common Documents locked?", "Upload your signed and notarized NDA first. The QA Center verifies it within 1–2 working days."],
  ["Account", "How do I change my name or department?", "These come from your QAC account. Contact the QA Center to correct them."],
];

function Steps({ steps }: { steps: Step[] }) {
  const router = useRouter();
  return (
    <div className="gs">
      {steps.map(([href, b, s], i) => (
        <div key={b} onClick={() => router.push(href)} role="link" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && router.push(href)}>
          <i>{i + 1}</i>
          <b>{b}</b>
          <span>{s}</span>
        </div>
      ))}
    </div>
  );
}

export function IaHelp() {
  return (
    <Scope name="ia">
      <div className="card">
        <h2>Help &amp; User Guide</h2>
        <div style={{ fontSize: 13, color: "var(--muted)", margin: "-8px 0 16px" }}>How to evaluate programs as an Internal Accreditor</div>
        <Steps steps={IA_STEPS} />
        <h3 style={{ fontSize: 14, margin: "22px 0 10px" }}>Frequently asked questions</h3>
        {IA_FAQ.map(([q, a]) => (
          <details key={q} className="fq">
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </Scope>
  );
}

export function RepHelp({ email }: { email: string }) {
  const [q, setQ] = useState("");
  const toast = useToast();
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const text = (n: React.ReactNode): string => (typeof n === "string" ? n : Array.isArray(n) ? n.map(text).join(" ") : n && typeof n === "object" && "props" in n ? text((n as { props: { children?: React.ReactNode } }).props.children) : "");
  const list = REP_FAQ.filter((f) => words.every((w) => `${f[0]} ${f[1]} ${text(f[2])}`.toLowerCase().includes(w)));
  return (
    <>
      <div className="card">
        <h2>Help &amp; User Guide</h2>
        <div className="sub" style={{ marginBottom: 16 }}>
          How to use QAC-WARDS as a Program Representative
        </div>
        <SearchBox variant="pill" value={q} onChange={setQ} placeholder="Search help, e.g. “rejected”" style={{ maxWidth: 480, marginBottom: 20 }} />
        <Steps steps={REP_STEPS} />
        <h3 style={{ fontSize: 14, margin: "22px 0 10px" }}>Frequently asked questions</h3>
        {list.length ? (
          list.map((f) => (
            <details key={f[1]} className="fq" open={Boolean(q) && list.length <= 2}>
              <summary>
                <span>
                  {f[1]}{" "}
                  <span className="pill p-miss" style={{ marginLeft: 6 }}>
                    {f[0]}
                  </span>
                </span>
              </summary>
              <p>{f[2]}</p>
            </details>
          ))
        ) : (
          <div className="empty">No results. Try another word or contact the QA Center.</div>
        )}
      </div>
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 16 }}>Still need help?</h2>
          <div className="sub">Quality Assurance Center · Mon–Fri, 8:00 AM – 5:00 PM</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn variant="o" href={`mailto:${email}`} external>
            ✉ Email QAC
          </Btn>
          <Btn onClick={() => toast.say("The QA Center hasn’t posted the user manual yet.")}>📄 User manual (PDF)</Btn>
        </div>
      </div>
    </>
  );
}
