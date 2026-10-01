"use client";

import { useState } from "react";
import Btn from "../../kit/Btn";
import Card, { CardHead } from "../../kit/Card";
import DocViewer from "../../kit/DocViewer";
import FileDrop from "../../kit/FileDrop";
import FilterPills from "../../kit/FilterPills";
import FullScreenViewer from "../../kit/FullScreenViewer";
import Modal from "../../kit/Modal";
import Pill from "../../kit/Pill";
import Result from "../../kit/Result";
import SearchBox from "../../kit/SearchBox";
import SegTabs from "../../kit/SegTabs";
import SumRows from "../../kit/SumRows";
import useAct from "../../kit/useAct";
import type { CommonDoc, QacDocumentsData, TplGroupKey, TplRow } from "@/lib/qac-documents";
import type { NdaItem } from "@/lib/qac-portal";
import {
  deleteCommonDoc,
  replaceNdaForm,
  restoreTemplateVersion,
  reviewNda,
  saveCommonDoc,
  saveTemplate,
  setTemplatePublished,
} from "@/lib/qac-document-actions";

type Tab = "tpl" | "common" | "nda";

const dl = (source: string, id: string, download?: boolean) => `/api/documents/download?source=${source}&id=${id}${download ? "&download=1" : ""}`;
const CATEGORIES = ["Institutional", "Policy", "AACCUP", "CHED", "Other"];
const ALL = "All program reps";

export default function QacDocuments({ data, initialTab, verify }: { data: QacDocumentsData; initialTab: Tab; verify: string | null }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const pend = data.ndas.filter((n) => n.status === "review").length;
  return (
    <Card>
      <CardHead title="Documents" sub="Files the QA Center shares with program representatives" />
      <SegTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "tpl", label: "Templates" },
          { key: "common", label: "Common Documents" },
          { key: "nda", label: "NDA Form", count: pend || undefined },
        ]}
      />
      {tab === "tpl" && <Templates data={data} />}
      {tab === "common" && <Common docs={data.common} colleges={data.colleges} />}
      {tab === "nda" && <Nda data={data} verify={verify} />}
    </Card>
  );
}

function Templates({ data }: { data: QacDocumentsData }) {
  const [lv, setLv] = useState<TplGroupKey>("areas");
  const [q, setQ] = useState("");
  const [modal, setModal] = useState<null | { k: "up"; row?: TplRow } | { k: "hist" | "hide" | "view"; row: TplRow }>(null);
  const { busy, run } = useAct();
  const g = data.groups.find((x) => x.key === lv)!;
  const ql = q.toLowerCase();
  const rows = g.rows.filter((t) => !ql || `${t.name}${t.file ?? ""}`.toLowerCase().includes(ql));
  return (
    <>
      <div className="rtool r2">
        <FilterPills
          flush
          value={lv}
          onChange={(k) => setLv(k)}
          items={data.groups.map((x) => ({
            key: x.key,
            label: (
              <>
                {x.label} <span style={{ opacity: 0.7 }}>{x.rows.length}</span>
              </>
            ),
          }))}
        />
        <div className="rbtns">
          <SearchBox variant="r-sm" value={q} onChange={setQ} placeholder="Search templates" />
          <Btn onClick={() => setModal({ k: "up" })}>＋ Add template</Btn>
        </div>
      </div>
      {rows.length ? (
        <div className="tscroll">
          <table>
            <thead>
              <tr>
                <th>Template for</th>
                <th>File</th>
                <th>Version</th>
                <th>Updated</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.key}>
                  <td>
                    <b style={{ fontWeight: 600 }}>{t.name}</b>
                    {t.sub && <small>{t.sub}</small>}
                  </td>
                  <td>
                    {t.file ? (
                      <>
                        <span className={t.ext === "pdf" ? "pdfi" : "docxi"}>{t.ext.toUpperCase()}</span> {t.file}
                      </>
                    ) : (
                      <span className="sub">No template yet</span>
                    )}
                  </td>
                  <td>{t.id ? `v${t.ver}` : "—"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {t.date}
                    {t.by && <small>{t.by}</small>}
                  </td>
                  <td>{t.id ? t.published ? <Pill tone="ok">Published</Pill> : <Pill tone="miss">Draft · hidden</Pill> : <Pill tone="miss">Missing</Pill>}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {t.id ? (
                      <>
                        {t.ext === "pdf" ? (
                          <Btn variant="gh" sm onClick={() => setModal({ k: "view", row: t })}>
                            View
                          </Btn>
                        ) : (
                          <Btn variant="gh" sm href={dl("template", t.id, true)}>
                            View
                          </Btn>
                        )}{" "}
                        <Btn variant="o" sm onClick={() => setModal({ k: "up", row: t })}>
                          ⬆ Replace
                        </Btn>{" "}
                        <Btn variant="gh" sm onClick={() => setModal({ k: "hist", row: t })}>
                          History
                        </Btn>{" "}
                        <Btn
                          variant="gh"
                          sm
                          disabled={busy}
                          onClick={() => (t.published ? setModal({ k: "hide", row: t }) : run(() => setTemplatePublished(t.id!, true), "Template published"))}
                        >
                          {t.published ? "Hide" : "Publish"}
                        </Btn>
                      </>
                    ) : (
                      <Btn variant="o" sm onClick={() => setModal({ k: "up", row: t })}>
                        ⬆ Upload
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">{q ? `No templates match “${q}”.` : "No templates in this group yet."}</div>
      )}
      <div className="sub" style={{ fontSize: 11.5, marginTop: 10 }}>
        🔒 Program reps see area templates as <b>view only</b> (watermarked). The General template is downloadable from the upload forms. Every template must use the PUP header/footer and
        form code <b>QAC-TPL-01</b>, which uploads are checked for.
      </div>
      {modal?.k === "up" && <TemplateUpload group={lv} groupLabel={g.label} row={modal.row} onClose={() => setModal(null)} />}
      {modal?.k === "hist" && <TemplateHistory row={modal.row} onClose={() => setModal(null)} />}
      {modal?.k === "hide" && (
        <Modal
          title="Hide this template?"
          sub={modal.row.name}
          onClose={() => setModal(null)}
          footer={
            <>
              <Btn variant="gh" onClick={() => setModal(null)}>
                Cancel
              </Btn>
              <Btn variant="d" disabled={busy} onClick={() => run(() => setTemplatePublished(modal.row.id!, false), "Template hidden", () => setModal(null))}>
                Hide
              </Btn>
            </>
          }
        >
          <p className="sub" style={{ lineHeight: 1.6 }}>
            Program reps won’t see it in Documents › Templates until you publish it again. Documents already uploaded are not affected.
          </p>
        </Modal>
      )}
      {modal?.k === "view" && (
        <FullScreenViewer
          url={dl("template", modal.row.id!)}
          file={modal.row.file ?? modal.row.name}
          meta={`${g.label} · ${modal.row.name} · v${modal.row.ver}`}
          note="Watermarked for viewers outside QAC · downloads are logged"
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

function TemplateUpload({ group, groupLabel, row, onClose }: { group: TplGroupKey; groupLabel: string; row?: TplRow; onClose: () => void }) {
  const replace = Boolean(row?.id);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [pub, setPub] = useState(true);
  const [notify, setNotify] = useState(true);
  const { busy, run, toast } = useAct();
  const save = () => {
    if (!file) return toast.say("Choose a .docx file first.", true);
    if (!row && !title.trim()) return toast.say("Enter what the template is for", true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("group", group);
    if (row?.id) fd.set("id", row.id);
    if (row?.areaId) fd.set("areaId", row.areaId);
    if (row?.levelId) fd.set("levelId", row.levelId);
    fd.set("title", row ? row.name : title);
    fd.set("note", note);
    fd.set("publish", pub ? "1" : "");
    fd.set("notify", notify ? "1" : "");
    run(() => saveTemplate(fd), pub ? "Template published" : "Template saved as draft", onClose);
  };
  return (
    <Modal
      title={replace ? "Replace template" : "Add template"}
      sub={`${groupLabel}${row ? ` · ${row.name}${replace ? ` · now v${row.ver}` : ""}` : ""}`}
      onClose={onClose}
      locked={busy}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn disabled={busy} onClick={save}>
            {replace ? "Upload new version" : "Add template"}
          </Btn>
        </>
      }
    >
      {!row && (
        <>
          <label className="fl">Template for *</label>
          <input
            className="inp"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={group === "gen" ? "e.g. PUP Memo Template" : "e.g. Area XI – Quality Assurance"}
          />
        </>
      )}
      <div className="mt12">
        <FileDrop
          exts={[".docx"]}
          className="dmdrop"
          hint="Word document (.docx) · max 25 MB · must use the PUP header/footer and form code QAC-TPL-01"
          file={file}
          onFile={setFile}
        />
      </div>
      {replace && (
        <>
          <label className="fl" style={{ marginTop: 12 }}>
            What changed? (shown in the version history)
          </label>
          <input className="inp" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Updated signature block" />
        </>
      )}
      <label className="chk2" style={{ marginTop: 12 }}>
        <input type="checkbox" checked={pub} onChange={(e) => setPub(e.target.checked)} /> Publish now (program reps see it right away)
      </label>
      <label className="chk2">
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Notify program reps{replace ? " who already started this document" : ""}
      </label>
    </Modal>
  );
}

function TemplateHistory({ row, onClose }: { row: TplRow; onClose: () => void }) {
  const { busy, run } = useAct();
  return (
    <Modal title="Version history" sub={row.name} onClose={onClose} footer={<Btn onClick={onClose}>Close</Btn>}>
      <table>
        <tbody>
          <tr>
            <th>Version</th>
            <th>File</th>
            <th>Uploaded</th>
            <th />
          </tr>
          {row.history.map((h) => (
            <tr key={`${h.ver}${h.id ?? "cur"}`}>
              <td>
                v{h.ver} {h.cur && <Pill tone="ok">Current</Pill>}
              </td>
              <td>{h.file}</td>
              <td>
                {h.date}
                <small>{h.by}</small>
              </td>
              <td style={{ textAlign: "right" }}>
                {!h.cur && h.id && (
                  <Btn variant="gh" sm disabled={busy} onClick={() => run(() => restoreTemplateVersion(h.id!), `v${h.ver} restored as the current version`, onClose)}>
                    Restore
                  </Btn>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}

function Common({ docs, colleges }: { docs: CommonDoc[]; colleges: [string, string][] }) {
  const [q, setQ] = useState("");
  const [modal, setModal] = useState<null | { k: "up"; d?: CommonDoc } | { k: "del" | "view"; d: CommonDoc }>(null);
  const { busy, run } = useAct();
  const ql = q.toLowerCase();
  const L = docs.filter((d) => !ql || `${d.title}${d.category}`.toLowerCase().includes(ql));
  return (
    <>
      <div className="rtool r2">
        <div className="sub" style={{ margin: 0 }}>
          Unlocked for a program rep only after the QA Center verifies their NDA.
        </div>
        <div className="rbtns">
          <SearchBox variant="r-sm" value={q} onChange={setQ} placeholder="Search documents" />
          <Btn onClick={() => setModal({ k: "up" })}>⬆ Upload document</Btn>
        </div>
      </div>
      {L.length ? (
        <div className="tscroll">
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Category</th>
                <th>Visible to</th>
                <th>Updated</th>
                <th>Views</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {L.map((d) => (
                <tr key={d.id}>
                  <td>
                    <span className="pdfi">PDF</span> <b style={{ fontWeight: 600 }}>{d.title}</b>
                    <small>{d.size}</small>
                  </td>
                  <td>{d.category}</td>
                  <td>{d.visibleTo}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{d.date}</td>
                  <td>{d.views}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <Btn variant="gh" sm onClick={() => setModal({ k: "view", d })}>
                      View
                    </Btn>{" "}
                    <Btn variant="o" sm onClick={() => setModal({ k: "up", d })}>
                      ⬆ Replace
                    </Btn>{" "}
                    <Btn variant="gh" sm title="Delete" onClick={() => setModal({ k: "del", d })}>
                      🗑
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">{docs.length ? "No documents match." : "No common documents uploaded yet."}</div>
      )}
      <div className="sub" style={{ fontSize: 11.5, marginTop: 10 }}>
        🔒 View only for program reps: watermarked with their name, no download or print. Each view is logged.
      </div>
      {modal?.k === "up" && <CommonUpload d={modal.d} colleges={colleges} onClose={() => setModal(null)} />}
      {modal?.k === "del" && (
        <Modal
          onClose={() => setModal(null)}
          footer={
            <>
              <Btn variant="gh" onClick={() => setModal(null)}>
                Cancel
              </Btn>
              <Btn variant="danger" disabled={busy} onClick={() => run(() => deleteCommonDoc(modal.d.id), "Document deleted", () => setModal(null))}>
                Delete
              </Btn>
            </>
          }
        >
          <Result tone="danger" icon="🗑" title={`Delete “${modal.d.title}”?`}>
            <p>Program reps will no longer see it.</p>
          </Result>
        </Modal>
      )}
      {modal?.k === "view" && (
        <FullScreenViewer
          url={dl("common", modal.d.id)}
          file={`${modal.d.title}.pdf`}
          meta={`Common Documents · ${modal.d.category}`}
          note="Watermarked for viewers outside QAC · downloads are logged"
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

function CommonUpload({ d, colleges, onClose }: { d?: CommonDoc; colleges: [string, string][]; onClose: () => void }) {
  const initial = d && d.visibleTo !== ALL ? d.visibleTo.replace(/ only$/, "").split(/,\s*/) : [];
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(d?.title ?? "");
  const [cat, setCat] = useState(d?.category ?? "Institutional");
  const [scope, setScope] = useState(initial.length ? "sel" : "all");
  const [sel, setSel] = useState<string[]>(initial);
  const [notify, setNotify] = useState(true);
  const { busy, run, toast } = useAct();
  const save = () => {
    if (!file) return toast.say("Choose a PDF first.", true);
    if (!title.trim()) return toast.say("Enter a title", true);
    if (scope === "sel" && !sel.length) return toast.say("Pick at least one college", true);
    const fd = new FormData();
    fd.set("file", file);
    if (d) fd.set("id", d.id);
    fd.set("title", title);
    fd.set("category", cat);
    fd.set("visibleTo", scope === "all" ? ALL : `${sel.join(", ")} only`);
    fd.set("notify", notify ? "1" : "");
    run(() => saveCommonDoc(fd), "Document uploaded", onClose);
  };
  return (
    <Modal
      title={d ? "Replace document" : "Upload common document"}
      sub={d?.title}
      onClose={onClose}
      locked={busy}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn disabled={busy} onClick={save}>
            {d ? "Replace" : "Upload"}
          </Btn>
        </>
      }
    >
      <FileDrop exts={[".pdf"]} className="dmdrop" hint="PDF only · max 25 MB" file={file} onFile={setFile} />
      <label className="fl" style={{ marginTop: 12 }}>
        Title *
      </label>
      <input className="inp" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Student Handbook 2026" />
      <div className="fg2">
        <div>
          <label className="fl">Category</label>
          <select className="inp" value={cat} onChange={(e) => setCat(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="fl">Visible to</label>
          <select className="inp" value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="all">{ALL}</option>
            <option value="sel">Selected colleges…</option>
          </select>
        </div>
      </div>
      {scope === "sel" && (
        <div className="pills" style={{ marginTop: 10 }}>
          {colleges.map(([c, n]) => (
            <button
              key={c}
              type="button"
              title={n}
              className={`pt ${sel.includes(c) ? "on" : ""}`}
              onClick={() => setSel(sel.includes(c) ? sel.filter((x) => x !== c) : [...sel, c])}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <label className="chk2" style={{ marginTop: 10 }}>
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Notify users who can see it
      </label>
    </Modal>
  );
}

function Nda({ data, verify }: { data: QacDocumentsData; verify: string | null }) {
  const [open, setOpen] = useState<NdaItem | null>(() => data.ndas.find((n) => n.id === verify) ?? null);
  const [form, setForm] = useState<"view" | "up" | null>(null);
  const f = data.ndaForm;
  return (
    <>
      <div className="ndaform">
        <span className="pdfi">PDF</span>
        <div style={{ flex: 1 }}>
          <b>{f.file}</b>
          <small>
            Blank NDA · v{f.ver} · {f.id ? `updated ${f.date}` : "built-in form"} · downloaded {f.dl} times
          </small>
        </div>
        <Btn variant="gh" sm onClick={() => setForm("view")}>
          View
        </Btn>
        <Btn variant="o" sm onClick={() => setForm("up")}>
          ⬆ Replace form
        </Btn>
      </div>
      <div className="sub" style={{ fontSize: 11.5, margin: "6px 0 18px" }}>
        Program reps download this form, have it signed and notarized, then upload the scan with the NDA File ID and notarial details.
      </div>
      <h3 className="h3s">Submitted NDAs</h3>
      {data.ndas.length ? (
        <div className="tscroll">
          <table>
            <thead>
              <tr>
                <th>Program rep</th>
                <th>College</th>
                <th>Uploaded</th>
                <th>NDA File ID</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.ndas.map((n) => (
                <tr key={n.id}>
                  <td>
                    <b style={{ fontWeight: 600 }}>{n.who}</b>
                    <small>{n.role}</small>
                  </td>
                  <td>{n.college}</td>
                  <td>
                    {n.date}
                    <small>{n.file}</small>
                  </td>
                  <td>
                    {n.fid}
                    <small>{n.atty}</small>
                  </td>
                  <td>{n.status === "review" ? <Pill tone="pend">For verification</Pill> : n.status === "verified" ? <Pill tone="ok">Verified</Pill> : <Pill tone="ret">Returned</Pill>}</td>
                  <td style={{ textAlign: "right" }}>
                    <Btn variant={n.status === "review" ? "s" : "gh"} sm onClick={() => setOpen(n)}>
                      {n.status === "review" ? "Verify" : "View"}
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">No NDAs submitted yet.</div>
      )}
      {open && <VerifyNda n={open} onClose={() => setOpen(null)} />}
      {form === "view" && (
        <FullScreenViewer
          url={f.id ? dl("template", f.id) : "/api/documents/nda-template?preview=1"}
          file={f.file}
          meta={`Blank NDA form · v${f.ver}`}
          note="Program reps get this form stamped with their own NDA File ID"
          onClose={() => setForm(null)}
        />
      )}
      {form === "up" && <NdaFormUpload ver={f.ver} onClose={() => setForm(null)} />}
    </>
  );
}

function NdaFormUpload({ ver, onClose }: { ver: number; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const { busy, run, toast } = useAct();
  return (
    <Modal
      title="Replace blank NDA form"
      sub={`Current: v${ver}`}
      onClose={onClose}
      locked={busy}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            disabled={busy}
            onClick={() => {
              if (!file) return toast.say("Choose a file first.", true);
              const fd = new FormData();
              fd.set("file", file);
              run(() => replaceNdaForm(fd), "NDA form updated", onClose);
            }}
          >
            Upload
          </Btn>
        </>
      }
    >
      <FileDrop exts={[".pdf"]} className="dmdrop" hint="PDF · max 25 MB · the NDA File ID is stamped on every page when a rep downloads it" file={file} onFile={setFile} />
      <div className="lockb" style={{ marginTop: 12, background: "#fff6d6" }}>
        ℹ <div>NDAs already signed with the old form stay valid. Reps who haven’t submitted yet will download the new one.</div>
      </div>
    </Modal>
  );
}

function VerifyNda({ n, onClose }: { n: NdaItem; onClose: () => void }) {
  const done = n.status !== "review";
  const [chk, setChk] = useState(false);
  const [rem, setRem] = useState("");
  const { busy, run, toast } = useAct();
  const act = (ok: boolean) => {
    if (ok && !chk) return toast.say("Tick the box after checking the details against the scan", true);
    if (!ok && !rem.trim()) return toast.say("Add a remark so the program rep knows what to fix", true);
    run(() => reviewNda(n.id, ok, rem), ok ? `NDA verified. ${n.who} can now open Common Documents.` : "NDA returned. The rep will re-upload it.", onClose);
  };
  return (
    <Modal
      size="wide"
      title={`${done ? "NDA" : "Verify NDA"} · ${n.who}`}
      sub={`${n.role} · ${n.college} · uploaded ${n.date}`}
      onClose={onClose}
      footer={
        done ? (
          <Btn onClick={onClose}>Close</Btn>
        ) : (
          <>
            <Btn variant="gh" onClick={onClose}>
              Cancel
            </Btn>
            <Btn variant="d" disabled={busy} onClick={() => act(false)}>
              ↺ Return
            </Btn>
            <Btn disabled={busy} onClick={() => act(true)}>
              ✓ Verify NDA
            </Btn>
          </>
        )
      }
    >
      <DocViewer docId={null} url={dl("nda", n.id)} />
      <div className="sub" style={{ margin: "12px 0 6px", fontSize: 12 }}>
        Details typed by the program rep when they submitted. Check that they match the scanned NDA.
      </div>
      <SumRows
        rows={[
          ["File", n.file],
          ["NDA File ID", n.fid],
          ["Notary public", n.atty],
          ["Doc. / Page / Book / Series", `${n.nd} / ${n.np} / ${n.nb} / ${n.ns}`],
        ]}
      />
      {done ? (
        <div style={{ marginTop: 12 }}>
          {n.status === "verified" ? <Pill tone="ok">Verified</Pill> : <Pill tone="ret">Returned</Pill>}
          {n.note && <span className="sub"> {n.note}</span>}
        </div>
      ) : (
        <>
          <label className="chk2" style={{ marginTop: 12 }}>
            <input type="checkbox" checked={chk} onChange={(e) => setChk(e.target.checked)} /> The NDA File ID and notarial details match the scanned copy, and it is signed and notarized.
          </label>
          <label className="fl" style={{ marginTop: 10 }}>
            Remark (required if you return it)
          </label>
          <textarea
            className="inp"
            rows={2}
            value={rem}
            onChange={(e) => setRem(e.target.value)}
            placeholder="e.g. The NDA File ID doesn’t match the form, or the notary seal is not visible on page 2."
          />
        </>
      )}
    </Modal>
  );
}
