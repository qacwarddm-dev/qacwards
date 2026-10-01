"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Btn from "./Btn";
import Modal from "./Modal";
import Pill from "./Pill";
import Result from "./Result";
import SumRows from "./SumRows";
import { useToast } from "./ToastProvider";
import type { Slot } from "@/lib/review-model";
import { ensureSubmission, submitDraft } from "@/lib/submission-actions";

export type UploadMode = "new" | "draft" | "resubmit" | "replace";

export type UploadTarget = {
  submissionId: string | null;
  programId: string;
  levelId: string;
  programShort: string;
  campus: string;
  college: string;
  levelName: string;
  groupName: string;
  slot: Slot;
  mode: UploadMode;
  progress: { req: number; up: number };
};

export type TemplateFile = { name: string; url: string | null; byRef?: Record<string, { name: string; url: string }> };

type Picked = { file: File; error: string | null };
type Row = { name: string; size: string; pct: number; state: "up" | "check" | "ok" };

const MB = 1024 * 1024;
const size = (b: number) => (b >= MB ? `${(b / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

function validate(f: File): string | null {
  if (!/\.pdf$/i.test(f.name)) return "Only PDF files are accepted. Open it in Word and use Save as PDF.";
  if (f.size > 25 * MB) return "File is larger than 25 MB. Compress it or split the annexes.";
  return null;
}

function post(form: FormData, onProgress: (p: number) => void, onSent: () => void) {
  return new Promise<{ ok: boolean; status: number; body: Record<string, unknown> }>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/submissions/upload");
    xhr.timeout = 120_000;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.upload.onload = onSent;
    xhr.onload = () => {
      let body: Record<string, unknown> = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 400 && !body.error) {
        // The host rejects oversized bodies (about 4.5 MB) before our route runs, with a non-JSON reply.
        body.error = xhr.status === 413 ? "That file is too large to upload. Compress it and try again." : `Upload failed (${xhr.status}). Try again.`;
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body });
    };
    xhr.onerror = () => resolve({ ok: false, status: 0, body: { error: "The connection dropped. Try again." } });
    xhr.ontimeout = () => resolve({ ok: false, status: 0, body: { error: "The upload timed out. Try again." } });
    xhr.send(form);
  });
}

export function TemplatePreview({ onClose, back, tpl, viewer, goHref }: { onClose: () => void; back?: () => void; tpl: TemplateFile; viewer: string; goHref?: string }) {
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <Modal
      size="wide"
      title={back ? "Template preview" : tpl.name.replace(/\.docx$/, "")}
      sub={back ? tpl.name : "Template from the Quality Assurance Center"}
      onClose={back ?? onClose}
      bodyStyle={{ background: "#e9e9e9" }}
      footer={
        back ? (
          <>
            <a className="pback" style={{ marginRight: "auto" }} role="button" onClick={back}>
              ‹ <span>
                Back to <b>Upload</b>
              </span>
            </a>
            {tpl.url && (
              <Btn href={tpl.url} download={tpl.name}>
                Download
              </Btn>
            )}
          </>
        ) : (
          <>
            <Btn variant="o" onClick={onClose}>
              Close
            </Btn>
            {tpl.url && (
              <Btn href={tpl.url} download={tpl.name}>
                ⬇ Download template
              </Btn>
            )}
            {goHref && <Btn href={goHref}>Go to Accreditation ›</Btn>}
          </>
        )
      }
    >
      <div className="vwrap" onContextMenu={(e) => e.preventDefault()}>
        <img src="/assets/portal/mockup/preview.jpg" alt="Template preview" draggable={false} />
        {!back && (
          <div className="wm">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i}>
                VIEW ONLY · {viewer} · {today}
              </span>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function UploadFlow({
  t,
  tpl: general,
  me,
  onClose,
  onView,
}: {
  t: UploadTarget;
  tpl: TemplateFile;
  me: string;
  onClose: () => void;
  onView?: () => void;
}) {
  const [stage, setStage] = useState<"form" | "tpl" | "uploading" | "success">("form");
  const [main, setMain] = useState<Picked | null>(null);
  const [extra, setExtra] = useState<Picked | null>(null);
  const [missing, setMissing] = useState(false);
  const [note, setNote] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const mainIn = useRef<HTMLInputElement>(null);
  const extraIn = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const router = useRouter();
  const slot = t.slot;
  const own = general.byRef?.[slot.refId];
  const tpl: TemplateFile = own ?? general;
  const lastReturn = [...slot.history].reverse().find((h) => h.tone === "rev");
  const title = t.mode === "resubmit" ? "Resubmit document" : t.mode === "replace" ? "Replace file" : "Upload document";
  const draftName = t.mode === "draft" ? slot.draftFile : null;

  async function submissionId() {
    if (t.submissionId) return t.submissionId;
    const r = await ensureSubmission(t.programId, t.levelId);
    if (!r.ok) {
      toast.say(r.error, true);
      return null;
    }
    return r.submissionId;
  }

  function form(sid: string, draft: boolean) {
    const f = new FormData();
    f.set("file", main!.file);
    if (extra && !draft) f.set("additional", extra.file);
    f.set("submissionId", sid);
    f.set(slot.kind === "phase" ? "phaseDocumentId" : "requirementAreaId", slot.refId);
    if (slot.docId && (t.mode === "resubmit" || t.mode === "replace")) f.set("supersedesId", slot.docId);
    f.set("title", main!.file.name);
    if (draft) f.set("isDraft", "1");
    if (note.trim()) f.set("note", note.trim());
    return f;
  }

  async function saveDraft() {
    if (!main || main.error) {
      setMissing(true);
      return;
    }
    const sid = await submissionId();
    if (!sid) return;
    const r = await post(form(sid, true), () => {}, () => {});
    if (!r.ok) return toast.say(String(r.body.error ?? "Could not save the draft."), true);
    onClose();
    toast.say("Draft saved. It isn’t submitted yet.");
    router.refresh();
  }

  async function upload() {
    if (!main && draftName && slot.draftId) {
      const r = await submitDraft(slot.draftId, note);
      if (!r.ok) return toast.say(r.error, true);
      setDone([draftName]);
      setStage("success");
      router.refresh();
      return;
    }
    if (!main) return setMissing(true);
    if (main.error || extra?.error) return toast.say("Fix the file errors first", true);
    const sid = await submissionId();
    if (!sid) return;
    const files = [main.file, ...(extra ? [extra.file] : [])];
    setRows(files.map((f) => ({ name: f.name, size: size(f.size), pct: 0, state: "up" })));
    setStage("uploading");
    const r = await post(
      form(sid, false),
      (p) => setRows((rs) => rs.map((x) => ({ ...x, pct: p }))),
      () => setRows((rs) => rs.map((x) => ({ ...x, pct: 100, state: "check" }))),
    );
    if (!r.ok) {
      setStage("form");
      return toast.say(String(r.body.error ?? "Upload failed."), true);
    }
    setRows((rs) => rs.map((x) => ({ ...x, state: "ok" })));
    setTimeout(() => {
      setDone(files.map((f) => f.name));
      setStage("success");
      toast.say("Document submitted for review");
      router.refresh();
    }, 900);
  }

  const pick = (k: "main" | "extra") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const p = { file: f, error: validate(f) };
    if (k === "main") {
      setMain(p);
      setMissing(false);
    } else setExtra(p);
  };

  const fslot = (k: "main" | "extra") => {
    const p = k === "main" ? main : extra;
    const label = k === "main" ? "File" : "Additional document";
    const shown = p ? p.file.name : k === "main" && draftName ? draftName : null;
    const err = p?.error ?? (k === "main" && missing ? "Choose a file to upload" : null);
    const docx = shown?.toLowerCase().endsWith(".docx");
    return (
      <>
        <label className="fl">
          {label} {k === "extra" ? <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span> : <em>*</em>}
        </label>
        <div className={`fslot${shown ? " has" : ""}${err ? " bad" : ""}`}>
          <span className={docx ? "docxi" : "pdfi"} style={shown ? undefined : { background: "#bbb" }}>
            {docx ? "DOCX" : "PDF"}
          </span>
          <div className="t">
            {shown ? (
              <>
                <b>{shown}</b>
                <small>{p ? size(p.file.size) : "Saved draft"}</small>
              </>
            ) : (
              <span style={{ color: "var(--muted)" }}>No file chosen</span>
            )}
            {err && <small style={{ color: "var(--red)", fontWeight: 600 }}>✕ {err}</small>}
          </div>
          {p && (
            <Btn variant="gh" sm onClick={() => (k === "main" ? setMain(null) : setExtra(null))}>
              Remove
            </Btn>
          )}
          <Btn variant="o" sm onClick={() => (k === "main" ? mainIn : extraIn).current?.click()}>
            {shown ? "Change" : "Choose file"}
          </Btn>
          <input ref={k === "main" ? mainIn : extraIn} type="file" accept="application/pdf,.pdf" hidden onChange={pick(k)} />
        </div>
        <div className="hint">ⓘ PDF only · max 25 MB · the PUP template or your program’s own template</div>
      </>
    );
  };

  if (stage === "tpl") return <TemplatePreview tpl={tpl} viewer={me} onClose={onClose} back={() => setStage("form")} />;

  if (stage === "uploading")
    return (
      <Modal title="Uploading…" sub="Please don’t close this window." locked onClose={() => {}} footer={<Btn loading>Uploading…</Btn>}>
        {rows.map((r) => (
          <div key={r.name} className="upi" style={{ marginBottom: 10 }}>
            <span className="pdfi">PDF</span>
            <div className="t">
              <b>{r.name}</b>
              <small>
                {r.state === "up" ? (
                  `${r.pct}% · ${r.size}`
                ) : r.state === "check" ? (
                  "Saving…"
                ) : (
                  <span style={{ color: "#1b7a30" }}>✓ Uploaded</span>
                )}
              </small>
              <div className="pbar">
                <i style={{ width: `${r.pct}%` }} />
              </div>
            </div>
            {r.state === "ok" ? <span style={{ fontSize: 18 }}>✅</span> : <div className="spin" />}
          </div>
        ))}
      </Modal>
    );

  if (stage === "success") {
    const up = Math.min(t.progress.req, t.progress.up + (slot.state === "missing" || slot.state === "draft" || slot.state === "returned" ? 1 : 0));
    const pct = t.progress.req ? Math.round((up / t.progress.req) * 100) : 0;
    return (
      <Modal
        onClose={onClose}
        footer={
          <>
            {onView && (
              <Btn
                variant="o"
                onClick={() => {
                  onClose();
                  onView();
                }}
              >
                View submission
              </Btn>
            )}
            <Btn onClick={onClose}>Done</Btn>
          </>
        }
      >
        <Result tone="ok" title={t.mode === "resubmit" ? "Resubmitted successfully!" : "Uploaded successfully!"}>
          <p>{slot.name} was sent to your internal accreditors for review.</p>
          <SumRows
            rows={[
              [
                "Files",
                <b key="f">
                  {done.map((d) => (
                    <span key={d} style={{ display: "block" }}>
                      {d}
                    </span>
                  ))}
                </b>,
              ],
              ["Submitted to", `${t.programShort} · ${t.levelName} · ${t.groupName}`],
              ["Submitted by", `${me} · ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`],
              ["Status", <Pill key="s" tone="pend">For review</Pill>],
              [`${t.levelName} progress`, `${pct}% · ${Math.max(0, t.progress.req - up)} left`],
            ]}
          />
        </Result>
      </Modal>
    );
  }

  return (
    <Modal
      title={title}
      sub={slot.name}
      onClose={onClose}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          {(t.mode === "new" || t.mode === "draft") && (
            <Btn variant="o" onClick={saveDraft}>
              Save draft
            </Btn>
          )}
          <Btn onClick={upload}>{t.mode === "resubmit" ? "Resubmit" : "Upload"}</Btn>
        </>
      }
    >
      <div className="ctx">
        {[t.campus, t.college, t.programShort, t.levelName, t.groupName].map((c) => (
          <span key={c}>🔒 {c}</span>
        ))}
      </div>
      <div className="howto">
        <span>
          <i>1</i>Download template
        </span>
        <span style={{ color: "#ccc" }}>›</span>
        <span>
          <i>2</i>Fill out &amp; save as PDF
        </span>
        <span style={{ color: "#ccc" }}>›</span>
        <span>
          <i>3</i>Upload
        </span>
      </div>
      {t.mode === "resubmit" && lastReturn && (
        <div className="rem" style={{ background: "var(--red-soft)", color: "#8f1d1d", borderRadius: 10, padding: "10px 12px", fontSize: 12.5, marginBottom: 12 }}>
          ↺ <b>What to fix ({lastReturn.who.split(",")[0]}):</b> {lastReturn.msg}
        </div>
      )}
      <div className="tplc">
        <span className="docxi">DOCX</span>
        <div className="t">
          <b>{tpl.name}</b>
          <small>{tpl.url ? "Template from the Quality Assurance Center" : "The QA Center hasn’t published this template yet"}</small>
        </div>
        <Btn variant="gh" sm onClick={() => setStage("tpl")}>
          Preview
        </Btn>
        {tpl.url && (
          <Btn variant="o" sm href={tpl.url} download={tpl.name}>
            Download
          </Btn>
        )}
      </div>
      {fslot("main")}
      <div style={{ height: 6 }} />
      {fslot("extra")}
      {(t.mode === "resubmit" || t.mode === "replace") && (
        <>
          <label className="fl">
            Note to the reviewer <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea className="inp" rows={2} placeholder="What did you change?" value={note} onChange={(e) => setNote(e.target.value)} />
        </>
      )}
    </Modal>
  );
}
