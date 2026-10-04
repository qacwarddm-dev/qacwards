"use client";

import { useMemo, useState } from "react";
import useNav from "../../kit/nav";
import BackLink from "../../kit/BackLink";
import Btn from "../../kit/Btn";
import CertStatusSelect, { CSTAT, certLevel } from "../../kit/CertStatusSelect";
import { CardHead } from "../../kit/Card";
import Crumbs, { type Crumb } from "../../kit/Crumbs";
import FileDrop from "../../kit/FileDrop";
import FolderIcon from "../../kit/FolderIcon";
import FullScreenViewer from "../../kit/FullScreenViewer";
import Modal from "../../kit/Modal";
import Pill from "../../kit/Pill";
import RecentlyDeleted from "../../kit/RecentlyDeleted";
import Result from "../../kit/Result";
import SearchBox from "../../kit/SearchBox";
import useAct from "../../kit/useAct";
import { FTYPES, type RepoFile, type RepoLoc, type RepoType, type Repository } from "@/lib/repository-model";
import { uploadDirect } from "@/lib/upload-client";
import { createCopcFolder, deleteCopcFile, renameCopcFile, restoreCopcFile, uploadCopcFile } from "@/lib/repository-actions";
import { daysTo, levelName } from "@/lib/qac-model";
import { shortDate } from "@/lib/program-names";

const LOCN: Record<RepoLoc, string> = { main: "Main Campus", camp: "Campuses" };
const fileUrl = (id: string, download?: boolean) => `/api/documents/download?source=repository&id=${id}${download ? "&download=1" : ""}`;

type Nav = { loc: RepoLoc | null; unit: string | null; type: RepoType | null };

export default function QacCopc({ repo, nav, today }: { repo: Repository; nav: Nav; today: string }) {
  const router = useNav();
  const [q, setQ] = useState("");
  const [fv, setFv] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<"name" | "date">("name");
  const [modal, setModal] = useState<null | { k: "folder" } | { k: "upload" } | { k: "rename" | "delete" | "view"; f: RepoFile }>(null);

  const go = (n: Partial<Nav>) => {
    const next = { ...nav, ...n };
    const sp = new URLSearchParams();
    if (next.loc) sp.set("loc", next.loc);
    if (next.loc && next.unit) sp.set("unit", next.unit);
    if (next.loc && next.unit && next.type) sp.set("type", next.type);
    setQ("");
    router.push(`/portal/aaccup-copc${sp.size ? `?${sp}` : ""}`);
  };

  const count = (unit: string, type?: RepoType) => repo.files.filter((f) => f.unit === unit && (!type || f.type === type)).length;
  const T = nav.type ? FTYPES.find((t) => t.key === nav.type)! : null;
  const unit = nav.unit ? repo.units.find((u) => u.key === nav.unit && u.loc === nav.loc) : null;
  const gone = (
    <RecentlyDeleted
      items={repo.deleted
        .filter((f) => (!nav.loc || f.loc === nav.loc) && (!nav.unit || f.unit === nav.unit) && (!nav.type || f.type === nav.type))
        .map((f) => ({ id: f.id, title: f.title, sub: `${f.program} · ${f.unit}`, deletedAt: f.deletedAt! }))}
      onRestore={restoreCopcFile}
    />
  );

  if (!nav.loc) {
    const main = repo.units.filter((u) => u.loc === "main" && u.college);
    const camp = repo.units.filter((u) => u.loc === "camp" && !u.customId);
    const hits = q.trim()
      ? repo.files.filter((f) => `${f.title} ${f.program} ${f.unit} ${f.uploadedAt.slice(0, 4)}`.toLowerCase().includes(q.trim().toLowerCase()))
      : [];
    return (
      <div className="card">
        <CardHead
          title="AACCUP & COPC"
          sub="Certificates, AACCUP reports and CHED COPC files for every program"
          right={<SearchBox variant="r-sm" value={q} onChange={setQ} placeholder="Search all files" />}
        />
        {q.trim() ? (
          hits.length ? (
            <table>
              <tbody>
                <tr>
                  <th>File</th>
                  <th>Location</th>
                  <th>Uploaded</th>
                </tr>
                {hits.map((h) => (
                  <tr key={h.id} className="click" onClick={() => go({ loc: h.loc, unit: h.unit, type: h.type })}>
                    <td>
                      <span className="pdfi">PDF</span> {h.title}
                    </td>
                    <td>
                      {h.unit} › {FTYPES.find((t) => t.key === h.type)!.name}
                    </td>
                    <td>{shortDate(h.uploadedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">No files match “{q}”.</div>
          )
        ) : (
          <div className="ccards">
            {(
              [
                ["main", "MAIN CAMPUS", main.map((c) => c.key).join(", ")],
                ["camp", "CAMPUSES", camp.map((c) => c.name).join(", ")],
              ] as const
            ).map(([k, t, list]) => (
              <div
                key={k}
                className="ccard"
                tabIndex={0}
                role="link"
                onClick={() => go({ loc: k })}
                onKeyDown={(e) => e.key === "Enter" && go({ loc: k })}
                style={{ backgroundImage: "url(/assets/portal/mockup/building.jpg)" }}
              >
                <div className="tint" />
                <div className="cband">
                  <b>{t}</b>
                </div>
                <div className="cover">
                  <p>{list}</p>
                  <span className="cbtn">See More</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {gone}
      </div>
    );
  }

  const crumbs: Crumb[] = [{ label: "AACCUP & COPC", onClick: () => go({ loc: null, unit: null, type: null }) }];
  crumbs.push(nav.unit ? { label: LOCN[nav.loc], onClick: () => go({ unit: null, type: null }) } : { label: LOCN[nav.loc] });
  if (nav.unit) crumbs.push(nav.type ? { label: nav.unit, onClick: () => go({ type: null }) } : { label: nav.unit });
  if (T) crumbs.push({ label: T.name });

  const back = nav.type ? (
    <BackLink to={nav.unit!} onClick={() => go({ type: null })} />
  ) : nav.unit ? (
    <BackLink to={LOCN[nav.loc]} onClick={() => go({ unit: null })} />
  ) : (
    <BackLink to="AACCUP & COPC" onClick={() => go({ loc: null })} />
  );

  const ql = q.toLowerCase();

  let body: React.ReactNode;
  if (T && nav.unit) {
    const L = repo.files
      .filter((f) => f.unit === nav.unit && f.type === T.key)
      .filter((f) => !ql || `${f.title} ${f.program} ${f.uploadedAt.slice(0, 4)}`.toLowerCase().includes(ql))
      .sort((a, b) => (sort === "name" ? a.title.localeCompare(b.title) : b.uploadedAt.localeCompare(a.uploadedAt)));
    body = L.length ? (
      <div className="tscroll">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Program</th>
              {T.validity && <th>Valid until</th>}
              <th>Uploaded</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {L.map((x) => {
              const dd = x.to ? daysTo(x.to, today) : null;
              return (
                <tr key={x.id} className="click" onClick={() => setModal({ k: "view", f: x })}>
                  <td>
                    <span className="pdfi">PDF</span> {x.title}
                  </td>
                  <td>
                    {x.program}
                    {(x.status || x.levelCode) && <small>{x.status || levelName(x.levelCode!)}</small>}
                  </td>
                  {T.validity && (
                    <td>
                      {x.to ? (
                        <>
                          {shortDate(x.to)}
                          <small>
                            <Pill tone={dd! < 0 ? "ret" : dd! <= 183 ? "pend" : "ok"}>{dd! < 0 ? "Expired" : dd! <= 183 ? `${dd} days left` : "Valid"}</Pill>
                          </small>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  )}
                  <td>
                    {shortDate(x.uploadedAt)}
                    <small>{x.by}</small>
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                    <Btn variant="o" sm onClick={() => setModal({ k: "view", f: x })}>
                      View
                    </Btn>{" "}
                    <Btn variant="gh" sm onClick={() => setModal({ k: "rename", f: x })}>
                      Rename
                    </Btn>{" "}
                    <Btn variant="gh" sm title="Delete" onClick={() => setModal({ k: "delete", f: x })}>
                      🗑
                    </Btn>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ) : q ? (
      <div className="empty">No files match “{q}”.</div>
    ) : (
      <div className="empty">
        <div className="big">🗂️</div>
        <b style={{ color: "var(--text)" }}>This folder is empty</b>
        <br />
        Upload the {T.name} for the programs of {nav.unit}.
        <br />
        <div className="mt12">
          <Btn onClick={() => setModal({ k: "upload" })}>⬆ Upload file</Btn>
        </div>
      </div>
    );
  } else if (nav.unit) {
    const L = FTYPES.filter((t) => !ql || t.name.toLowerCase().includes(ql));
    body =
      fv === "grid" ? (
        <div className="fgrid">
          {L.map((t) => {
            const n = count(nav.unit!, t.key);
            return (
              <div key={t.key} className="fold" role="link" onClick={() => go({ type: t.key })}>
                <FolderIcon org={t.org} />
                <div className="n">{t.name}</div>
                <small>{n ? `${n} file${n > 1 ? "s" : ""}` : "Empty"}</small>
              </div>
            );
          })}
        </div>
      ) : (
        <FolderTable rows={L.map((t) => ({ key: t.key, name: t.name, n: count(nav.unit!, t.key), open: () => go({ type: t.key }) }))} />
      );
  } else {
    const units = repo.units
      .filter((u) => u.loc === nav.loc && (!ql || u.name.toLowerCase().includes(ql)))
      .sort((a, b) => (sort === "date" ? count(b.key) - count(a.key) : 0));
    body = !units.length ? (
      <div className="empty">No folders match “{q}”.</div>
    ) : fv === "grid" ? (
      <div className="fgrid">
        {units.map((u) => {
          const n = count(u.key);
          return (
            <div key={u.key} className="fold" role="link" onClick={() => go({ unit: u.key })}>
              {u.college ? <FolderIcon college={u.college} /> : <FolderIcon seal />}
              <div className="n">{u.name}</div>
              <small>{n ? `${n} file${n > 1 ? "s" : ""}` : "Empty"}</small>
            </div>
          );
        })}
      </div>
    ) : (
      <FolderTable rows={units.map((u) => ({ key: u.key, name: u.name, n: count(u.key), open: () => go({ unit: u.key }) }))} />
    );
  }

  return (
    <>
      <div className="card">
        <div className="ch">
          <Crumbs big items={crumbs} />
          {back}
        </div>
        <div className="rtool r2">
          <div className="rbtns">
            {T ? <Btn onClick={() => setModal({ k: "upload" })}>⬆ Upload file</Btn> : <Btn variant="o" onClick={() => setModal({ k: "folder" })}>＋ New folder</Btn>}
          </div>
          <SearchBox variant="r-sm" value={q} onChange={setQ} placeholder={T ? "Search files" : "Search folders"} />
          <div className="rbtns">
            <button className={`vbtn${fv === "list" ? " on" : ""}`} onClick={() => setFv("list")} title="List view">
              ☰
            </button>
            <button className={`vbtn${fv === "grid" ? " on" : ""}`} onClick={() => setFv("grid")} title="Grid view">
              ▦
            </button>
            <select className="inp" style={{ width: "auto" }} value={sort} onChange={(e) => setSort(e.target.value as "name" | "date")}>
              <option value="name">Sort: Name</option>
              <option value="date">Sort: Newest</option>
            </select>
          </div>
        </div>
        {body}
        {gone}
      </div>
      {modal?.k === "folder" && <NewFolderModal loc={nav.loc} where={nav.unit ?? LOCN[nav.loc]} onClose={() => setModal(null)} />}
      {modal?.k === "upload" && T && nav.unit && (
        <UploadModal
          type={T}
          unit={nav.unit}
          customId={unit?.customId ?? null}
          folderId={repo.folderIds[T.key]}
          programs={repo.programs.filter((p) => p.unit === nav.unit).length ? repo.programs.filter((p) => p.unit === nav.unit) : repo.programs}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.k === "rename" && <RenameModal f={modal.f} onClose={() => setModal(null)} />}
      {modal?.k === "delete" && <DeleteModal f={modal.f} onClose={() => setModal(null)} />}
      {modal?.k === "view" && T && (
        <FullScreenViewer
          url={fileUrl(modal.f.id)}
          downloadHref={fileUrl(modal.f.id, true)}
          file={modal.f.title}
          meta={`${nav.unit} · ${T.name} · ${modal.f.program}${modal.f.to ? ` · valid until ${shortDate(modal.f.to)}` : ""}`}
          note="Program reps can view this file in their Documents → Reports"
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

function FolderTable({ rows }: { rows: { key: string; name: string; n: number; open: () => void }[] }) {
  return (
    <table>
      <tbody>
        <tr>
          <th>Folder</th>
          <th>Files</th>
          <th />
        </tr>
        {rows.map((r) => (
          <tr key={r.key} className="click" onClick={r.open}>
            <td>📁 {r.name}</td>
            <td>{r.n}</td>
            <td style={{ textAlign: "right" }}>
              <span className="lnk">Open ›</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function NewFolderModal({ loc, where, onClose }: { loc: RepoLoc; where: string; onClose: () => void }) {
  const [v, setV] = useState("");
  const { busy, run, toast } = useAct();
  return (
    <Modal
      title="New folder"
      sub={where}
      onClose={onClose}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn disabled={busy} onClick={() => (v.trim() ? run(() => createCopcFolder(loc, v), "Folder created", onClose) : toast.say("Enter a folder name", true))}>
            Create
          </Btn>
        </>
      }
    >
      <label className="fl">Folder name</label>
      <input className="inp" autoFocus value={v} onChange={(e) => setV(e.target.value)} placeholder={loc === "camp" ? "e.g. Lopez Extension" : "e.g. Institute of Technology"} />
    </Modal>
  );
}

function RenameModal({ f, onClose }: { f: RepoFile; onClose: () => void }) {
  const [v, setV] = useState(f.title.replace(/\.pdf$/i, ""));
  const { busy, run, toast } = useAct();
  return (
    <Modal
      title="Rename file"
      onClose={onClose}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn disabled={busy} onClick={() => (v.trim() ? run(() => renameCopcFile(f.id, v), "File renamed", onClose) : toast.say("Enter a name", true))}>
            Save
          </Btn>
        </>
      }
    >
      <input className="inp" autoFocus value={v} onChange={(e) => setV(e.target.value)} />
      <small className="sub">.pdf is kept</small>
    </Modal>
  );
}

function DeleteModal({ f, onClose }: { f: RepoFile; onClose: () => void }) {
  const { busy, run } = useAct();
  return (
    <Modal
      onClose={onClose}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="danger" disabled={busy} onClick={() => run(() => deleteCopcFile(f.id), "File moved to Recently deleted", onClose)}>
            Delete
          </Btn>
        </>
      }
    >
      <Result tone="danger" icon="🗑" title={`Delete “${f.title}”?`}>
        <p>
          Program reps and accreditors will no longer see it. It stays in <b>Recently deleted</b> for 30 days.
        </p>
      </Result>
    </Modal>
  );
}

function UploadModal({
  type,
  unit,
  customId,
  folderId,
  programs,
  onClose,
}: {
  type: (typeof FTYPES)[number];
  unit: string;
  customId: string | null;
  folderId: string;
  programs: Repository["programs"];
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [prog, setProg] = useState(programs[0]?.id ?? "");
  const [status, setStatus] = useState(CSTAT[0][1]);
  const cert = type.key === "cert";
  const [from, setFrom] = useState(type.validity ? new Date().toISOString().slice(0, 10) : "");
  const [to, setTo] = useState(() => {
    if (!cert) return "";
    const d = new Date();
    d.setFullYear(d.getFullYear() + 3);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  });
  const { busy, run, toast } = useAct();
  const sorted = useMemo(() => [...programs].sort((a, b) => a.name.localeCompare(b.name)), [programs]);

  const save = () => {
    if (!file) return toast.say("Choose a PDF to upload", true);
    if (cert && !to) return toast.say("Enter the validity end date", true);
    if (cert && !status.trim()) return toast.say("Type the status written on the certificate", true);
    const fd = new FormData();
    const path = `${prog}/${folderId}/${crypto.randomUUID()}.pdf`;
    fd.set("path", path);
    fd.set("fileName", file.name);
    fd.set("programId", prog);
    fd.set("folderId", folderId);
    if (customId) fd.set("unitId", customId);
    if (type.validity) {
      fd.set("from", from);
      fd.set("to", to);
    }
    if (cert) {
      fd.set("status", status);
      fd.set("level", certLevel(status) ?? "");
    }
    return run(
      async () => {
        const up = await uploadDirect("repository", path, file, "application/pdf");
        return up.ok ? uploadCopcFile(fd) : up;
      },
      "Uploaded. Program reps of this college were notified.",
      onClose,
    );
  };

  return (
    <Modal
      title={`Upload to ${type.name}`}
      sub={unit}
      onClose={onClose}
      locked={busy}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn disabled={busy} onClick={save}>
            {busy ? "Uploading…" : "Upload"}
          </Btn>
        </>
      }
    >
      <FileDrop exts={[".pdf"]} label="Choose a PDF or drag it here" hint="PDF only · max 25 MB" file={file} onFile={setFile} />
      <div className="fg2">
        <div>
          <label className="fl">Program *</label>
          <select className="inp" value={prog} onChange={(e) => setProg(e.target.value)}>
            {sorted.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {type.validity && (
          <>
            {cert ? (
              <div>
                <label className="fl">Status on certificate *</label>
                <CertStatusSelect value={status} onChange={setStatus} />
              </div>
            ) : (
              <div />
            )}
            <div>
              <label className="fl">Valid from *</label>
              <input className="inp" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="fl">Valid until {cert ? "*" : "(if any)"}</label>
              <input className="inp" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </>
        )}
      </div>
      {type.validity && (
        <div className="sub" style={{ fontSize: 11.5, marginTop: 8 }}>
          📅 The validity dates power the expiry alerts on the Dashboard and in Reports.
        </div>
      )}
    </Modal>
  );
}
