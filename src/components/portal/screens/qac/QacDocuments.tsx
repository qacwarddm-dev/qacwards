"use client";

import { useState } from "react";
import Btn from "../../kit/Btn";
import Card, { CardHead } from "../../kit/Card";
import DocViewer from "../../kit/DocViewer";
import FileDrop from "../../kit/FileDrop";
import FilterPills from "../../kit/FilterPills";
import FolderPath from "../../kit/FolderPath";
import FolderTable from "../../kit/FolderTable";
import FullScreenViewer from "../../kit/FullScreenViewer";
import Modal from "../../kit/Modal";
import Pill from "../../kit/Pill";
import RecentlyDeleted from "../../kit/RecentlyDeleted";
import Result from "../../kit/Result";
import SearchBox from "../../kit/SearchBox";
import SegTabs from "../../kit/SegTabs";
import SumRows from "../../kit/SumRows";
import useAct from "../../kit/useAct";
import useContentMatches from "../../kit/useContentMatches";
import { childrenOf, folderOptions, subtreeIds, trailOf } from "@/lib/common-folders";
import type { CommonDoc, CommonFolder, CommonVersion, QacDocumentsData, TplGroupKey, TplRow } from "@/lib/qac-documents";
import type { NdaItem } from "@/lib/qac-portal";
import { safeName, uploadDirect } from "@/lib/upload-client";
import {
  createCommonFolder,
  deleteCommonDoc,
  deleteCommonFolder,
  moveCommonDoc,
  moveCommonFolder,
  renameCommonFolder,
  replaceNdaForm,
  restoreTemplateVersion,
  restoreCommonDoc,
  restoreCommonDocVersion,
  reviewNda,
  saveCommonDoc,
  saveTemplate,
  setTemplatePublished,
} from "@/lib/qac-document-actions";

type Tab = "tpl" | "common" | "nda";

const dl = (source: string, id: string, download?: boolean) => `/api/documents/download?source=${source}&id=${id}${download ? "&download=1" : ""}`;
const CATEGORIES = ["Institutional", "Policy", "AACCUP", "CHED", "Other"];
const ALL = "All program reps";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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
          { key: "tpl", label: "Toolkit" },
          { key: "common", label: "Common Documents" },
          { key: "nda", label: "NDA Form", count: pend || undefined },
        ]}
      />
      {tab === "tpl" && <Templates data={data} />}
      {tab === "common" && <Common docs={data.common} folders={data.folders} deleted={data.commonDeleted} colleges={data.colleges} />}
      {tab === "nda" && <Nda data={data} verify={verify} />}
    </Card>
  );
}

function Templates({ data }: { data: QacDocumentsData }) {
  const [lv, setLv] = useState<TplGroupKey>("areas");
  const [q, setQ] = useState("");
  const text = useContentMatches(["template"], q);
  const [modal, setModal] = useState<null | { k: "up"; row?: TplRow } | { k: "hist" | "hide" | "view"; row: TplRow }>(null);
  const { busy, run } = useAct();
  const g = data.groups.find((x) => x.key === lv)!;
  const ql = q.toLowerCase();
  const rows = g.rows.filter((t) => !ql || (t.id !== null && text.ids.has(t.id)) || `${t.name}${t.file ?? ""}`.toLowerCase().includes(ql));
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
          <SearchBox variant="r-sm" value={q} onChange={setQ} placeholder="Search toolkit" />
          <Btn onClick={() => setModal({ k: "up" })}>＋ Add toolkit file</Btn>
        </div>
      </div>
      {rows.length ? (
        <div className="tscroll">
          <table>
            <thead>
              <tr>
                <th>Toolkit for</th>
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
                      <span className="sub">No toolkit file yet</span>
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
                          <Btn variant="gh" sm href={dl("template", t.id, true)} download>
                            ⬇ Download
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
                          onClick={() => (t.published ? setModal({ k: "hide", row: t }) : run(() => setTemplatePublished(t.id!, true), "Toolkit file published"))}
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
        <div className="empty">{q ? (text.pending ? "Searching inside files…" : `No toolkit files match “${q}”.`) : "No toolkit files in this group yet."}</div>
      )}
      <div className="sub" style={{ fontSize: 11.5, marginTop: 10 }}>
        Program reps can only view these toolkit files in Documents. Reps may also upload documents that don’t use them, such as a program’s own version.
      </div>
      {modal?.k === "up" && <TemplateUpload group={lv} groupLabel={g.label} row={modal.row} onClose={() => setModal(null)} />}
      {modal?.k === "hist" && <TemplateHistory row={modal.row} onClose={() => setModal(null)} />}
      {modal?.k === "hide" && (
        <Modal
          title="Hide this toolkit file?"
          sub={modal.row.name}
          onClose={() => setModal(null)}
          footer={
            <>
              <Btn variant="gh" onClick={() => setModal(null)}>
                Cancel
              </Btn>
              <Btn variant="d" disabled={busy} onClick={() => run(() => setTemplatePublished(modal.row.id!, false), "Toolkit file hidden",() => setModal(null))}>
                Hide
              </Btn>
            </>
          }
        >
          <p className="sub" style={{ lineHeight: 1.6 }}>
            Program reps won’t see it in Documents › Toolkit until you publish it again. Documents already uploaded are not affected.
          </p>
        </Modal>
      )}
      {modal?.k === "view" && (
        <FullScreenViewer
          url={dl("template", modal.row.id!)}
          downloadHref={dl("template", modal.row.id!, true)}
          file={modal.row.file ?? modal.row.name}
          meta={`${g.label} · ${modal.row.name} · v${modal.row.ver}`}
          note="Program reps can only view this toolkit file"
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
    if (!row && !title.trim()) return toast.say("Enter what the toolkit file is for", true);
    const fd = new FormData();
    const path = `${group}/${crypto.randomUUID()}/${safeName(file.name)}`;
    fd.set("path", path);
    fd.set("fileName", file.name);
    fd.set("group", group);
    if (row?.id) fd.set("id", row.id);
    if (row?.areaId) fd.set("areaId", row.areaId);
    if (row?.levelId) fd.set("levelId", row.levelId);
    fd.set("title", row ? row.name : title);
    fd.set("note", note);
    fd.set("publish", pub ? "1" : "");
    fd.set("notify", notify ? "1" : "");
    return run(
      async () => {
        const up = await uploadDirect("templates", path, file, DOCX);
        return up.ok ? saveTemplate(fd) : up;
      },
      pub ? "Toolkit file published" : "Toolkit file saved as draft",
      onClose,
    );
  };
  return (
    <Modal
      title={replace ? "Replace toolkit file" : "Add toolkit file"}
      sub={`${groupLabel}${row ? ` · ${row.name}${replace ? ` · now v${row.ver}` : ""}` : ""}`}
      onClose={onClose}
      locked={busy}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn disabled={busy} onClick={save}>
            {replace ? "Upload new version" : "Add toolkit file"}
          </Btn>
        </>
      }
    >
      {!row && (
        <>
          <label className="fl">Toolkit for *</label>
          <input
            className="inp"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={group === "gen" ? "e.g. PUP Memo Toolkit" : "e.g. Area XI – Quality Assurance"}
          />
        </>
      )}
      <div className="mt12">
        <FileDrop
          exts={[".docx"]}
          className="dmdrop"
          hint="Word document (.docx) · max 25 MB"
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

function Common({ docs, folders, deleted, colleges }: { docs: CommonDoc[]; folders: CommonFolder[]; deleted: CommonDoc[]; colleges: [string, string][] }) {
  const [q, setQ] = useState("");
  const text = useContentMatches(["common"], q);
  const [folder, setFolder] = useState<string | null>(null);
  const [modal, setModal] = useState<
    null | { k: "up"; d?: CommonDoc } | { k: "del" | "view" | "hist" | "move"; d: CommonDoc } | { k: "vview"; d: CommonDoc; v: CommonVersion } | { k: "folder"; f?: CommonFolder; parent?: string | null } | { k: "delf" | "movef"; f: CommonFolder }
  >(null);
  const { busy, run } = useAct();
  const ql = q.toLowerCase();
  const open = folders.find((f) => f.id === folder) ?? null;
  const L = docs.filter((d) => (ql ? text.ids.has(d.id) || `${d.title}${d.category}`.toLowerCase().includes(ql) : d.folderId === (open?.id ?? null)));
  return (
    <>
      <div className="rtool r2">
        <div className="sub" style={{ margin: 0 }}>
          Unlocked for a program rep only after the QA Center verifies their NDA.
        </div>
        <div className="rbtns">
          <SearchBox variant="r-sm" value={q} onChange={setQ} placeholder="Search documents" />
          <Btn variant="o" onClick={() => setModal({ k: "folder", parent: open?.id ?? null })}>
            ＋ New folder
          </Btn>
          <Btn onClick={() => setModal({ k: "up" })}>⬆ Upload document</Btn>
        </div>
      </div>
      {open && !ql && <FolderPath root="Common Documents" trail={trailOf(folders, open.id)} onGo={setFolder} />}
      {!ql && childrenOf(folders, open?.id ?? null).length > 0 && (
        <FolderTable
          rows={childrenOf(folders, open?.id ?? null).map((f) => ({
            key: f.id,
            name: f.name,
            n: f.n,
            open: () => setFolder(f.id),
            items: [
              { label: "Rename", onClick: () => setModal({ k: "folder", f }) },
              { label: "Move", onClick: () => setModal({ k: "movef", f }) },
              { label: "Delete folder", danger: true, onClick: () => setModal({ k: "delf", f }) },
            ],
          }))}
        />
      )}
      {L.length ? (
        <div className="tscroll">
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Version</th>
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
                    <span className={d.ext === "docx" ? "docxi" : "pdfi"}>{d.ext.toUpperCase()}</span> <b style={{ fontWeight: 600 }}>{d.title}</b>
                    <small>{d.size}</small>
                  </td>
                  <td>v{d.version}</td>
                  <td>{d.category}</td>
                  <td>{d.visibleTo}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{d.date}</td>
                  <td>{d.views}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <Btn variant="gh" sm onClick={() => setModal({ k: "view", d })}>
                      View
                    </Btn>{" "}
                    <Btn variant="o" sm onClick={() => setModal({ k: "up", d })}>
                      ⬆ New version
                    </Btn>{" "}
                    <Btn variant="gh" sm onClick={() => setModal({ k: "hist", d })}>
                      History
                    </Btn>{" "}
                    {folders.length > 0 && (
                      <>
                        <Btn variant="gh" sm onClick={() => setModal({ k: "move", d })}>
                          Move
                        </Btn>{" "}
                      </>
                    )}
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
        (ql || !childrenOf(folders, open?.id ?? null).length) && (
          <div className="empty">{ql ? (text.pending ? "Searching inside files…" : "No documents match.") : open ? "This folder is empty." : "No common documents uploaded yet."}</div>
        )
      )}
      <div className="sub" style={{ fontSize: 11.5, marginTop: 10 }}>
        🔒 View only for program reps: watermarked with their name, no download or print. Each view is logged.
      </div>
      <RecentlyDeleted items={deleted.map((d) => ({ id: d.id, title: d.title, sub: d.category, deletedAt: d.deletedAt! }))} onRestore={restoreCommonDoc} />
      {modal?.k === "up" && <CommonUpload d={modal.d} folders={folders} folder={open?.id ?? null} colleges={colleges} onClose={() => setModal(null)} />}
      {modal?.k === "folder" && <FolderForm f={modal.f} parent={modal.parent ?? null} folders={folders} onClose={() => setModal(null)} />}
      {modal?.k === "movef" && <MoveFolder f={modal.f} folders={folders} onClose={() => setModal(null)} />}
      {modal?.k === "move" && <MoveDoc d={modal.d} folders={folders} onClose={() => setModal(null)} />}
      {modal?.k === "delf" && (
        <Modal
          onClose={() => setModal(null)}
          footer={
            <>
              <Btn variant="gh" onClick={() => setModal(null)}>
                Cancel
              </Btn>
              <Btn
                variant="danger"
                disabled={busy}
                onClick={() =>
                  run(
                    () => deleteCommonFolder(modal.f.id),
                    "Folder deleted",
                    () => {
                      if (folder && subtreeIds(folders, modal.f.id).has(folder)) setFolder(null);
                      setModal(null);
                    },
                  )
                }
              >
                Delete folder
              </Btn>
            </>
          }
        >
          <Result tone="danger" icon="🗑" title={`Delete the folder “${modal.f.name}”?`}>
            <p>
              Any folders inside it are deleted too. The {modal.f.n} document{modal.f.n === 1 ? "" : "s"} inside will not be deleted. They move out to the main Common Documents list.
            </p>
          </Result>
        </Modal>
      )}
      {modal?.k === "del" && (
        <Modal
          onClose={() => setModal(null)}
          footer={
            <>
              <Btn variant="gh" onClick={() => setModal(null)}>
                Cancel
              </Btn>
              <Btn variant="danger" disabled={busy} onClick={() => run(() => deleteCommonDoc(modal.d.id), "Document moved to Recently deleted", () => setModal(null))}>
                Delete
              </Btn>
            </>
          }
        >
          <Result tone="danger" icon="🗑" title={`Delete “${modal.d.title}”?`}>
            <p>
              Program reps will no longer see it. You can bring it back from <b>Recently deleted</b>.
            </p>
          </Result>
        </Modal>
      )}
      {modal?.k === "view" && (
        <FullScreenViewer
          url={dl("common", modal.d.id)}
          downloadHref={dl("common", modal.d.id, true)}
          file={`${modal.d.title}.${modal.d.ext}`}
          meta={`Common Documents · ${modal.d.category} · v${modal.d.version}`}
          note="Program reps can view and download this file"
          onClose={() => setModal(null)}
        />
      )}
      {modal?.k === "hist" && <CommonHistory d={modal.d} onView={(v) => setModal({ k: "vview", d: modal.d, v })} onClose={() => setModal(null)} />}
      {modal?.k === "vview" && (
        <FullScreenViewer
          url={modal.v.id ? dl("common_version", modal.v.id) : dl("common", modal.d.id)}
          downloadHref={modal.v.id ? dl("common_version", modal.v.id, true) : dl("common", modal.d.id, true)}
          file={`${modal.v.title} v${modal.v.ver}.${modal.v.ext}`}
          meta={`Common Documents · v${modal.v.ver}`}
          note="Earlier versions are only visible to the QA Center"
          onClose={() => setModal({ k: "hist", d: modal.d })}
        />
      )}
    </>
  );
}

function CommonHistory({ d, onView, onClose }: { d: CommonDoc; onView: (v: CommonVersion) => void; onClose: () => void }) {
  const { busy, run } = useAct();
  return (
    <Modal title="Version history" sub={d.title} onClose={onClose} locked={busy} footer={<Btn onClick={onClose}>Close</Btn>}>
      <table>
        <tbody>
          <tr>
            <th>Version</th>
            <th>Uploaded</th>
            <th>What changed</th>
            <th />
          </tr>
          {d.history.map((h) => (
            <tr key={`${h.ver}${h.id ?? "cur"}`}>
              <td>
                v{h.ver} {h.cur && <Pill tone="ok">Current</Pill>}
              </td>
              <td style={{ whiteSpace: "nowrap" }}>
                {h.date}
                <small>
                  {h.by} · {h.size}
                </small>
              </td>
              <td>{h.note || (h.ver === 1 ? "First upload" : "—")}</td>
              <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <Btn variant="gh" sm onClick={() => onView(h)}>
                  View
                </Btn>
                {!h.cur && h.id && (
                  <>
                    {" "}
                    <Btn variant="gh" sm disabled={busy} onClick={() => run(() => restoreCommonDocVersion(h.id!), `v${h.ver} restored as the current version`, onClose)}>
                      Restore
                    </Btn>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="sub" style={{ fontSize: 11.5, marginTop: 10 }}>
        Program reps always see the current version only.
      </div>
    </Modal>
  );
}

function CommonUpload({ d, folders, folder, colleges, onClose }: { d?: CommonDoc; folders: CommonFolder[]; folder: string | null; colleges: [string, string][]; onClose: () => void }) {
  const initial = d && d.visibleTo !== ALL ? d.visibleTo.replace(/ only$/, "").split(/,\s*/) : [];
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(d?.title ?? "");
  const [cat, setCat] = useState(d?.category ?? "Institutional");
  const [scope, setScope] = useState(initial.length ? "sel" : "all");
  const [sel, setSel] = useState<string[]>(initial);
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [dest, setDest] = useState(folder ?? "");
  const { busy, run, toast } = useAct();
  const save = () => {
    if (!file) return toast.say("Choose a PDF or Word file first.", true);
    if (!title.trim()) return toast.say("Enter a title", true);
    if (scope === "sel" && !sel.length) return toast.say("Pick at least one college", true);
    const fd = new FormData();
    const path = `${crypto.randomUUID()}/${safeName(file.name)}`;
    fd.set("path", path);
    fd.set("fileName", file.name);
    if (d) fd.set("id", d.id);
    fd.set("title", title);
    fd.set("category", cat);
    fd.set("visibleTo", scope === "all" ? ALL : `${sel.join(", ")} only`);
    fd.set("colleges", scope === "all" ? "" : sel.join(","));
    fd.set("note", note);
    fd.set("folderId", dest);
    fd.set("notify", notify ? "1" : "");
    return run(
      async () => {
        const up = await uploadDirect("common-docs", path, file, /\.docx$/i.test(file.name) ? DOCX : "application/pdf");
        return up.ok ? saveCommonDoc(fd) : up;
      },
      d ? "New version uploaded" : "Document uploaded",
      onClose,
    );
  };
  return (
    <Modal
      title={d ? "Upload new version" : "Upload common document"}
      sub={d ? `${d.title} · now v${d.version} → becomes v${d.version + 1}` : undefined}
      onClose={onClose}
      locked={busy}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn disabled={busy} onClick={save}>
            {d ? "Upload new version" : "Upload"}
          </Btn>
        </>
      }
    >
      <FileDrop exts={[".pdf", ".docx"]} className="dmdrop" hint="PDF or Word (.docx) · max 25 MB" file={file} onFile={setFile} />
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
      {!d && folders.length > 0 && (
        <>
          <label className="fl" style={{ marginTop: 12 }}>
            Folder
          </label>
          <select className="inp" value={dest} onChange={(e) => setDest(e.target.value)}>
            <option value="">No folder</option>
            {folderOptions(folders).map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </>
      )}
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
      {d && (
        <>
          <label className="fl" style={{ marginTop: 12 }}>
            What changed? (shown in the version history)
          </label>
          <input className="inp" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Updated to the 2026 revision" />
        </>
      )}
      <label className="chk2" style={{ marginTop: 10 }}>
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Notify users who can see it
      </label>
    </Modal>
  );
}

function FolderForm({ f, parent, folders, onClose }: { f?: CommonFolder; parent: string | null; folders: CommonFolder[]; onClose: () => void }) {
  const [name, setName] = useState(f?.name ?? "");
  const { busy, run, toast } = useAct();
  const save = () => {
    if (!name.trim()) return toast.say("Enter a folder name", true);
    return run(() => (f ? renameCommonFolder(f.id, name) : createCommonFolder(name, parent)), f ? "Folder renamed" : "Folder created", onClose);
  };
  return (
    <Modal
      title={f ? "Rename folder" : "New folder"}
      sub={!f && parent ? `Inside ${trailOf(folders, parent).map((x) => x.name).join(" › ")}` : undefined}
      onClose={onClose}
      locked={busy}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn disabled={busy} onClick={save}>
            {f ? "Rename" : "Create folder"}
          </Btn>
        </>
      }
    >
      <label className="fl">Folder name *</label>
      <input className="inp" autoFocus maxLength={80} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} placeholder="e.g. Student Handbooks" />
    </Modal>
  );
}

function MoveFolder({ f, folders, onClose }: { f: CommonFolder; folders: CommonFolder[]; onClose: () => void }) {
  const [dest, setDest] = useState(f.parentId ?? "");
  const { busy, run } = useAct();
  const blocked = subtreeIds(folders, f.id);
  return (
    <Modal
      title="Move folder"
      sub={f.name}
      onClose={onClose}
      locked={busy}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn disabled={busy || dest === (f.parentId ?? "")} onClick={() => run(() => moveCommonFolder(f.id, dest || null), "Folder moved", onClose)}>
            Move
          </Btn>
        </>
      }
    >
      <label className="fl">Move into</label>
      <select className="inp" value={dest} onChange={(e) => setDest(e.target.value)}>
        <option value="">Top level (Common Documents)</option>
        {folderOptions(folders)
          .filter((o) => !blocked.has(o.id))
          .map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
      </select>
    </Modal>
  );
}

function MoveDoc({ d, folders, onClose }: { d: CommonDoc; folders: CommonFolder[]; onClose: () => void }) {
  const [dest, setDest] = useState(d.folderId ?? "");
  const { busy, run } = useAct();
  return (
    <Modal
      title="Move document"
      sub={d.title}
      onClose={onClose}
      locked={busy}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn disabled={busy || dest === (d.folderId ?? "")} onClick={() => run(() => moveCommonDoc(d.id, dest || null), "Document moved", onClose)}>
            Move
          </Btn>
        </>
      }
    >
      <label className="fl">Folder</label>
      <select className="inp" value={dest} onChange={(e) => setDest(e.target.value)}>
        <option value="">No folder (main list)</option>
        {folderOptions(folders).map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </select>
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
          downloadHref={f.id ? dl("template", f.id, true) : undefined}
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
              const path = `nda/${crypto.randomUUID()}/${safeName(file.name)}`;
              fd.set("path", path);
              fd.set("fileName", file.name);
              return run(
                async () => {
                  const up = await uploadDirect("templates", path, file, "application/pdf");
                  return up.ok ? replaceNdaForm(fd) : up;
                },
                "NDA form updated",
                onClose,
              );
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
    return run(() => reviewNda(n.id, ok, rem), ok ? `NDA verified. ${n.who} can now open Common Documents.` : "NDA returned. The rep will re-upload it.", onClose);
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
      <div style={{ marginTop: 8 }}>
        <Btn variant="o" sm href={dl("nda", n.id, true)} download>
          ⬇ Download scanned NDA
        </Btn>
      </div>
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
