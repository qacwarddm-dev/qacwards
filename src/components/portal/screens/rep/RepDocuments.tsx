"use client";

import { useRouter } from "next/navigation";
import { Fragment, useMemo, useRef, useState } from "react";
import useBusy from "../../kit/useBusy";
import BackLink from "../../kit/BackLink";
import Btn from "../../kit/Btn";
import Empty from "../../kit/Empty";
import FileGrid from "../../kit/FileGrid";
import FileViewModal from "../../kit/FileViewModal";
import FolderIcon from "../../kit/FolderIcon";
import Icon from "../../kit/Icon";
import Pill from "../../kit/Pill";
import SegTabs from "../../kit/SegTabs";
import { MiniRing } from "../../kit/Spinner";
import StepsReminder from "../../kit/StepsReminder";
import { useToast } from "../../kit/ToastProvider";
import useContentMatches from "../../kit/useContentMatches";
import { TemplatePreview } from "../../kit/UploadFlow";
import type { RepDocumentsData, TemplateGroup } from "@/lib/rep-documents";
import { countCommonView, getOwnNdaUrl, myNdaFileIds, uploadNda } from "@/lib/document-actions";
import type { NdaFields } from "@/lib/nda-scan";
import { createClient } from "@/lib/supabase/browser";
import { uploadDirect } from "@/lib/upload-client";

type Tab = "templates" | "common" | "reports";
const dl = (source: string, id: string, download?: boolean) => `/api/documents/download?source=${source}&id=${id}${download ? "&download=1" : ""}`;

export default function RepDocuments({ data, me, initialTab }: { data: RepDocumentsData; me: string; initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "templates");
  return (
    <div className="card fpanel">
      <SegTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "templates", label: "Templates" },
          { key: "common", label: "Common Documents" },
          { key: "reports", label: "AACCUP & COPC Reports" },
        ]}
      />
      {tab === "templates" && <Templates groups={data.templates} me={me} />}
      {tab === "common" && <Common data={data} me={me} />}
      {tab === "reports" && <Reports data={data} me={me} />}
    </div>
  );
}

function MiniPage({ title }: { title: string }) {
  return (
    <div className="mini">
      <div className="hd">
        <img src="/assets/portal/mockup/seal.png" alt="" />
        <div style={{ flex: 1 }}>
          <i style={{ width: "60%" }} />
          <i style={{ width: "80%", marginTop: 2 }} />
        </div>
      </div>
      <div className="ttl">{title.toUpperCase()}</div>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="ln" />
      ))}
      <div className="ft" />
    </div>
  );
}

function Templates({ groups, me }: { groups: TemplateGroup[]; me: string }) {
  const [open, setOpen] = useState<TemplateGroup | null>(null);
  const [preview, setPreview] = useState<{ name: string; id: string | null; pdf: boolean } | null>(null);
  if (!open)
    return (
      <>
        <div className="lvhint">Click a level to view its document templates.</div>
        <div className="lvg">
          {groups.map((g) => {
            const n = g.sections.reduce((s, x) => s + x.items.length, 0);
            return (
              <div key={g.key} className="lvk" tabIndex={0} role="button" onClick={() => setOpen(g)} onKeyDown={(e) => e.key === "Enter" && setOpen(g)}>
                <div className="ph" style={{ backgroundImage: "url(/assets/portal/mockup/building.jpg)" }}>
                  <span className="chip">{g.chip}</span>
                </div>
                <div className="band">{g.label}</div>
                <div className="ft">
                  <span>{n} templates</span>
                  <b>
                    View Templates <Icon name="arrowRight" size={15} stroke={2} />
                  </b>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  return (
    <>
      <div className="ch">
        <div>
          <div className="crumb" style={{ margin: "0 0 4px" }}>
            <a role="button" onClick={() => setOpen(null)}>
              Templates
            </a>{" "}
            › {open.full}
          </div>
          <h2>{open.full}</h2>
        </div>
        <BackLink to="Levels" onClick={() => setOpen(null)} />
      </div>
      {open.sections.map((s, i) => (
        <Fragment key={i}>
          {s.h && (
            <div className="sech">
              {s.h} <small>{s.sub}</small>
            </div>
          )}
          <div className="tgrid" style={{ marginBottom: 22 }}>
            {s.items.map((t) => (
              <div key={t.name} className="tpl" title={t.name} onClick={() => setPreview({ name: t.name, id: t.templateId, pdf: t.isPdf })}>
                <div className="tt">
                  <span className="docxi">DOCX</span>
                  <span>{t.name}</span>
                </div>
                <MiniPage title={t.name} />
                <div className="ta">
                  <Btn
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreview({ name: t.name, id: t.templateId, pdf: t.isPdf });
                    }}
                  >
                    👁 View template
                  </Btn>
                  {t.templateId && (
                    <span onClick={(e) => e.stopPropagation()}>
                      <Btn variant="o" href={dl("template", t.templateId, true)} download>
                        ⬇ Download
                      </Btn>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Fragment>
      ))}
      {preview &&
        (preview.id && preview.pdf ? (
          <FileViewModal title={preview.name} sub="Template from the Quality Assurance Center" src={dl("template", preview.id)} downloadHref={dl("template", preview.id, true)} viewer={me} onClose={() => setPreview(null)} />
        ) : (
          <TemplatePreview tpl={{ name: preview.name, url: preview.id ? dl("template", preview.id, true) : null }} viewer={me} goHref="/portal/submission" onClose={() => setPreview(null)} />
        ))}
    </>
  );
}

function NdaTracker({ step }: { step: number }) {
  const L = ["Download NDA", "Sign & notarize", "Upload & submit", "QAC verifies"];
  return (
    <div className="ntrk">
      {L.map((l, i) => {
        const st = i < step ? "done" : i === step ? "on" : "";
        return (
          <Fragment key={l}>
            {i > 0 && <span className="sep">›</span>}
            <span className={`ts ${st}`}>
              <i>{st === "done" ? "✓" : i + 1}</i>
              {l}
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}

function Common({ data, me }: { data: RepDocumentsData; me: string }) {
  const [downloaded, setDownloaded] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [f, setF] = useState<NdaFields>({ id: "", atty: "", doc: "", page: "", book: "", series: "" });
  const [bad, setBad] = useState<Record<string, boolean>>({});
  const [scan, setScan] = useState<{ pct: number; filled?: number } | null>(null);
  const scanRun = useRef(0);
  const autoFilled = useRef(new Set<keyof NdaFields>());
  const [drag, setDrag] = useState(false);
  const [view, setView] = useState<{ title: string; src: string | null; own?: boolean } | null>(null);
  const [pending, start] = useBusy();
  const [opening, setOpening] = useState(false);
  const [reminder, setReminder] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const router = useRouter();
  const st = data.nda.status;
  const step = st === "verified" ? 4 : st === "review" ? 3 : file ? 2 : downloaded ? 1 : 0;
  const hint = <div className="lvhint" style={{ marginBottom: 12 }}>Please upload the signed and notarized Non-Disclosure Agreement Form before you can access the Common Documents.</div>;

  function pick(x: File | undefined) {
    if (!x) return;
    if (!/\.pdf$/i.test(x.name)) return toast.say("Only PDF files are accepted. Save the signed NDA as PDF.", true);
    if (x.size > 10 * 1024 * 1024) return toast.say("File is larger than 10 MB. Please compress the scan.", true);
    setDownloaded(true);
    setFile(x);
    void readScan(x);
  }

  async function readScan(x: File) {
    const run = ++scanRun.current;
    setScan({ pct: 0 });
    let got: Partial<NdaFields> = {};
    try {
      const [{ scanNda }, issued] = await Promise.all([import("@/lib/nda-scan"), myNdaFileIds()]);
      got = await scanNda(x, issued, (pct) => run === scanRun.current && setScan({ pct }));
    } catch (e) {
      console.error("NDA scan failed", e);
    }
    if (run !== scanRun.current) return;
    setF((cur) => {
      const next = { ...cur };
      for (const k of Object.keys(next) as (keyof NdaFields)[]) {
        // A field the user typed into is theirs; one we filled from the previous file is not.
        if (cur[k].trim() && !autoFilled.current.has(k)) continue;
        next[k] = got[k] ?? "";
        if (next[k]) autoFilled.current.add(k);
        else autoFilled.current.delete(k);
      }
      return next;
    });
    setBad({});
    setScan({ pct: 100, filled: Object.values(got).filter(Boolean).length });
  }

  function submit() {
    const b: Record<string, boolean> = {};
    for (const k of ["id", "atty", "doc", "page", "book", "series"] as const) b[k] = !f[k].trim();
    if (f.id && !/^QAC-NDA-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(f.id.trim())) b.id = true;
    if (f.series && !/^\d{4}$/.test(f.series.trim())) b.series = true;
    setBad(b);
    if (Object.values(b).some(Boolean)) return toast.say("Please check the highlighted fields", true);
    const fd = new FormData();
    fd.set("fileId", f.id.trim());
    fd.set("attorney", f.atty.trim());
    fd.set("docNo", f.doc.trim());
    fd.set("pageNo", f.page.trim());
    fd.set("bookNo", f.book.trim());
    fd.set("series", f.series.trim());
    return start(async () => {
      const { data } = await createClient().auth.getUser();
      if (!data.user) return toast.say("Your session expired. Sign in again.", true);
      const path = `${data.user.id}/nda-${crypto.randomUUID()}.pdf`;
      fd.set("path", path);
      fd.set("fileName", file!.name);
      try {
        const up = await uploadDirect("ndas", path, file!, "application/pdf");
        if (!up.ok) return toast.say(up.error, true);
        const r = await uploadNda(fd);
        if (!r.ok) return toast.say(r.error, true);
      } catch {
        return toast.say("The upload failed. Check your connection and try again.", true);
      }
      toast.say("NDA submitted for verification");
      router.refresh();
    });
  }

  if (st === "verified")
    return (
      <>
        <NdaTracker step={4} />
        <div className="ch" style={{ marginTop: 14 }}>
          <div>
            <h2>Common Documents</h2>
            <div className="sub">Shared university documents · view only</div>
          </div>
          <Pill tone="ok">✓ NDA verified</Pill>
        </div>
        <table>
          <tbody>
            <tr>
              <th>Document</th>
              <th>Updated</th>
              <th>Size</th>
              <th />
            </tr>
            {data.common.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="pdfi">PDF</span> {c.title}
                </td>
                <td>{c.date}</td>
                <td>{c.size}</td>
                <td style={{ textAlign: "right" }}>
                  <Btn
                    variant="o"
                    sm
                    onClick={() => {
                      countCommonView(c.id);
                      setView({ title: `${c.title}.pdf`, src: dl("common", c.id) });
                    }}
                  >
                    View
                  </Btn>
                </td>
              </tr>
            ))}
            {!data.common.length && (
              <tr>
                <td colSpan={4}>
                  <Empty>The QA Center hasn’t shared any common documents yet.</Empty>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {view && <FileViewModal title={view.title} src={view.src} viewer={me} onClose={() => setView(null)} />}
      </>
    );

  if (st === "review")
    return (
      <>
        {hint}
        <NdaTracker step={3} />
        <div className="ndac">
          <div className="ndi" style={{ background: "#fff6d6" }}>
            ⏳
          </div>
          <div className="ndt">
            <b>Your NDA is under review</b>
            <p>
              We received your signed NDA (NDA File ID <b>{data.nda.fileId}</b>). The QA Center usually verifies it within 1–2 working days. You’ll get a notification when Common
              Documents unlock.
            </p>
          </div>
          <div className="ndsep" />
          <div className="nds" style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              className="nbtn o"
              disabled={opening}
              aria-busy={opening || undefined}
              onClick={async () => {
                setOpening(true);
                const src = await getOwnNdaUrl().finally(() => setOpening(false));
                setView({ title: "Submitted NDA", src, own: true });
              }}
            >
              {opening && <MiniRing />}
              View submitted NDA
            </button>
          </div>
        </div>
        {view && <FileViewModal title={view.title} src={view.src} own onClose={() => setView(null)} />}
      </>
    );

  return (
    <>
      {hint}
      <NdaTracker step={step} />
      {st === "returned" && (
        <div className="lockb" style={{ background: "#fdecec" }}>
          ↺{" "}
          <div>
            <b>The QA Center returned your NDA.</b> {data.nda.note}
          </div>
        </div>
      )}
      <div className="ndac">
        <div className="ndi">
          <Icon name="sign" size={22} stroke={1.8} color="#800000" />
        </div>
        <div className="ndt">
          <b>Signed Document Required</b>
          <p>Download the blank form, have it signed and notarized, then upload the scanned copy.</p>
        </div>
        <div className="ndsep" />
        <div className="nds">
          <span className="lb">STEP 1</span>
          <a
            className={`nbtn o${downloaded ? " done" : ""}`}
            href="/api/documents/nda-template"
            onClick={() =>
              setTimeout(() => {
                setDownloaded(true);
                setReminder(true);
              }, 50)
            }
          >
            {downloaded ? (
              "✓ Downloaded"
            ) : (
              <>
                <Icon name="download" size={16} stroke={2} /> Download NDA Form
              </>
            )}
          </a>
          {downloaded && (
            <a className="mini-l" href="/api/documents/nda-template" onClick={() => setTimeout(() => setReminder(true), 50)}>
              Download again
            </a>
          )}
        </div>
        <div
          className={`nds${drag ? " drag" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            pick(e.dataTransfer.files[0]);
          }}
        >
          <span className="lb">STEP 2</span>
          <button type="button" className="nbtn s" onClick={() => input.current?.click()}>
            {file ? (
              `✓ ${file.name.length > 22 ? `${file.name.slice(0, 20)}…` : file.name}`
            ) : (
              <>
                <Icon name="upload" size={16} stroke={2} /> Upload Signed Copy
              </>
            )}
          </button>
          <span className="mini-l" style={{ color: "#999", textDecoration: "none" }}>
            {file ? (
              <a style={{ color: "var(--maroon)", cursor: "pointer" }} onClick={() => input.current?.click()}>
                Change file
              </a>
            ) : (
              "or drag and drop here · PDF only, max 10MB"
            )}
          </span>
          <input ref={input} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => pick(e.target.files?.[0])} />
        </div>
      </div>
      {reminder && (
        <StepsReminder
          title="NDA downloaded"
          sub="Complete these steps before you upload"
          onClose={() => setReminder(false)}
          steps={[
            { title: "Print and sign", text: "Print the form and sign it where indicated." },
            { title: "Have it notarized", text: "Bring the signed form to a notary public and have it notarized." },
            { title: "Scan the notarized copy", text: "Scan the whole document and save it as a PDF (max 10 MB)." },
            { title: "Upload it here", text: "Click Upload Signed Copy. The NDA File ID and notarial details are read from your scan; check them, then submit." },
          ]}
        />
      )}
      {file && (
        <div className="form">
          <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
            {scan && scan.filled === undefined ? (
              <>
                <MiniRing /> Reading the File ID and notarial details from your scan… {scan.pct}%
              </>
            ) : scan?.filled ? (
              `Filled ${scan.filled} of 6 fields from your scan. Check each one against the signed form before you submit.`
            ) : (
              "We couldn’t read the details from this scan. Enter the NDA File ID printed at the top of the form and the notarial details stamped by the notary public."
            )}
          </div>
          {(
            [
              ["id", "NDA File ID", "QAC-NDA-XXXX-XXXX", "Format: QAC-NDA-XXXX-XXXX"],
              ["atty", "Name of Attorney (Notary Public)", "e.g. Atty. Juan Dela Cruz", "Required"],
            ] as const
          ).map(([k, l, ph, h]) => (
            <div key={k} className={`fi2${bad[k] ? " bad" : ""}`}>
              <label className="fl">
                {l} <em>*</em>
              </label>
              <input
                className="inp"
                placeholder={ph}
                value={f[k]}
                onChange={(e) => {
                  autoFilled.current.delete(k);
                  setF({ ...f, [k]: e.target.value });
                  setBad({ ...bad, [k]: false });
                }}
              />
              <div className="ferr">{h}</div>
            </div>
          ))}
          <div className="fg2">
            {(
              [
                ["doc", "Doc. No.", "e.g. 123"],
                ["page", "Page No.", "e.g. 25"],
                ["book", "Book No.", "e.g. IV"],
                ["series", "Series of", "e.g. 2026"],
              ] as const
            ).map(([k, l, ph]) => (
              <div key={k} className={`fi2${bad[k] ? " bad" : ""}`}>
                <label className="fl">
                  {l} <em>*</em>
                </label>
                <input
                  className="inp"
                  placeholder={ph}
                  value={f[k]}
                  onChange={(e) => {
                    autoFilled.current.delete(k);
                    setF({ ...f, [k]: e.target.value });
                    setBad({ ...bad, [k]: false });
                  }}
                />
                <div className="ferr">Required</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Btn variant="gh" onClick={() => setFile(null)}>
              Cancel
            </Btn>
            <Btn disabled={pending || (scan !== null && scan.filled === undefined)} onClick={submit}>
              Submit NDA
            </Btn>
          </div>
        </div>
      )}
    </>
  );
}

function Reports({ data, me }: { data: RepDocumentsData; me: string }) {
  const [q, setQ] = useState("");
  const text = useContentMatches(["repository"], q);
  const [folderMode, setFolderMode] = useState<"grid" | "list">("grid");
  const [fileMode, setFileMode] = useState<"grid" | "list">("list");
  const [sort, setSort] = useState<"name" | "date">("name");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [menu, setMenu] = useState(false);
  const [folder, setFolder] = useState<string | null>(null);
  const [view, setView] = useState<{ title: string; id: string } | null>(null);
  const ql = q.toLowerCase();
  const folders = useMemo(() => {
    let L = data.folders.map((f) => ({ ...f, last: f.files[0]?.iso ?? "" }));
    if (ql) L = L.filter((f) => f.name.toLowerCase().includes(ql) || f.files.some((x) => text.ids.has(x.id) || `${x.name} ${x.iso.slice(0, 4)}`.toLowerCase().includes(ql)));
    L.sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : a.last.localeCompare(b.last)));
    if (dir === "desc") L.reverse();
    return L;
  }, [data.folders, ql, sort, dir, text.ids]);
  const cur = data.folders.find((f) => f.id === folder);
  const fv = cur ? fileMode : folderMode;
  const setFv = cur ? setFileMode : setFolderMode;
  const files = useMemo(() => {
    const L = (cur?.files ?? []).filter((x) => !ql || text.ids.has(x.id) || `${x.name} ${x.iso.slice(0, 4)}`.toLowerCase().includes(ql));
    L.sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : a.iso.localeCompare(b.iso)));
    if (dir === "desc") L.reverse();
    return L;
  }, [cur, ql, sort, dir, text.ids]);

  return (
    <>
      <div className="lvhint" style={{ marginBottom: 12 }}>
        Click a folder to view the document.
      </div>
      <div className="rtool">
        <div className="rsearch">
          <Icon name="search" size={16} stroke={2} color="#666" />
          <input placeholder="Search by report name or year" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="rbtns">
          <button type="button" className={`vbtn${fv === "list" ? " on" : ""}`} title="List view" aria-label="List view" onClick={() => setFv("list")}>
            <Icon name="list" size={17} stroke={2} />
          </button>
          <button type="button" className={`vbtn${fv === "grid" ? " on" : ""}`} title="Grid view" aria-label="Grid view" onClick={() => setFv("grid")}>
            <Icon name="grid" size={16} stroke={2} />
          </button>
          <div className="dd" style={{ marginLeft: 6 }}>
            <button type="button" className="sbtn" onClick={() => setMenu(!menu)}>
              <Icon name="sort" size={15} stroke={2} /> Sort: {sort === "name" ? "Name" : "Date"} <span style={{ fontSize: 11 }}>⌄</span>
            </button>
            <div className={`ddm${menu ? " show" : ""}`} onMouseLeave={() => setMenu(false)}>
              <div className="lb">Sort by</div>
              <a className={sort === "name" ? "on" : ""} onClick={() => (setSort("name"), setDir("asc"), setMenu(false))}>
                Name
              </a>
              <a className={sort === "date" ? "on" : ""} onClick={() => (setSort("date"), setDir("desc"), setMenu(false))}>
                Date modified
              </a>
              <div className="lb">Direction</div>
              <a className={dir === "asc" ? "on" : ""} onClick={() => (setDir("asc"), setMenu(false))}>
                {sort === "name" ? "A to Z" : "Oldest first"}
              </a>
              <a className={dir === "desc" ? "on" : ""} onClick={() => (setDir("desc"), setMenu(false))}>
                {sort === "name" ? "Z to A" : "Newest first"}
              </a>
            </div>
          </div>
        </div>
      </div>
      {cur ? (
        <>
          <div className="ch" style={{ marginBottom: 10 }}>
            <div className="crumb" style={{ margin: 0, fontSize: 15 }}>
              <a role="button" onClick={() => setFolder(null)}>
                AACCUP &amp; COPC Reports
              </a>{" "}
              › <b style={{ color: "var(--text)" }}>{cur.name}</b>
            </div>
            <BackLink to="Reports" onClick={() => setFolder(null)} />
          </div>
          {files.length && fv === "grid" ? (
            <FileGrid items={files.map((x) => ({ id: x.id, name: x.name, sub: x.date }))} onOpen={(id) => setView({ title: files.find((x) => x.id === id)!.name, id })} />
          ) : files.length ? (
            <table>
              <tbody>
                <tr>
                  <th>Name</th>
                  <th>Owner</th>
                  <th>Date modified</th>
                  <th>Size</th>
                  <th />
                </tr>
                {files.map((x) => (
                    <tr key={x.id} className="click" onClick={() => setView({ title: x.name, id: x.id })}>
                      <td>
                        <span className="pdfi">PDF</span> {x.name}
                      </td>
                      <td>Quality Assurance Center</td>
                      <td>{x.date}</td>
                      <td>{x.size}</td>
                      <td style={{ textAlign: "right" }}>
                        <Btn variant="o" sm>
                          View
                        </Btn>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <Empty icon="🗂️" title="This folder is empty">
              The QA Center hasn’t uploaded anything here yet. You’ll be notified when they do.
            </Empty>
          )}
        </>
      ) : !folders.length ? (
        <Empty>{text.pending ? "Searching inside files…" : `No folders match “${q}”.`}</Empty>
      ) : fv === "grid" ? (
        <div className="fgrid">
          {folders.map((f) => (
            <div key={f.id} className="fold" onClick={() => setFolder(f.id)}>
              <FolderIcon org={f.org} />
              <div className="n">{f.name}</div>
            </div>
          ))}
        </div>
      ) : (
        <table>
          <tbody>
            <tr>
              <th>Name</th>
              <th>Owner</th>
              <th>Date modified</th>
              <th>Items</th>
              <th />
            </tr>
            {folders.map((f) => (
              <tr key={f.id} className="click" onClick={() => setFolder(f.id)}>
                <td>
                  <span className="lfold">📁</span> {f.name}
                </td>
                <td>Quality Assurance Center</td>
                <td>{f.files[0]?.date ?? "—"}</td>
                <td>
                  {f.files.length} file{f.files.length === 1 ? "" : "s"}
                </td>
                <td style={{ textAlign: "right" }}>
                  <span className="lnk">Open ›</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: 14, fontSize: 11.5, color: "var(--muted)" }}>🔒 View only. Files from the QA Center can’t be downloaded, renamed or deleted.</div>
      {view && <FileViewModal title={view.title} src={dl("repository", view.id)} viewer={me} onClose={() => setView(null)} />}
    </>
  );
}
