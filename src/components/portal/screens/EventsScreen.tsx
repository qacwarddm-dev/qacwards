"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Btn from "../kit/Btn";
import Card from "../kit/Card";
import Empty from "../kit/Empty";
import Modal from "../kit/Modal";
import SearchBox from "../kit/SearchBox";
import SegTabs from "../kit/SegTabs";
import StatTile, { StatGrid } from "../kit/StatTile";
import SumRows from "../kit/SumRows";
import { useToast } from "../kit/ToastProvider";
import {
  MON,
  MONL,
  TC,
  WD,
  cdTxt,
  daysBetween,

  evEnd,
  evOn,
  evStart,
  evStatus,
  fmt,
  icsHref,
  parseDay,
  rangeLabel,
  type CalEvent,
  type CalType,
} from "../kit/calendar";
import { cancelEvent, createPortalEvent } from "@/lib/event-actions";

export type EventExtra = { icon: string; title: string; sub: string; action: string; href: string };

export default function EventsScreen({
  events,
  today,
  initialDate,
  canManage,
  programs = [],
  extras = {},
}: {
  events: CalEvent[];
  today: string;
  initialDate?: string;
  canManage?: boolean;
  programs?: { id: string; short: string }[];
  extras?: Record<string, EventExtra[]>;
}) {
  const t = parseDay(today);
  const init = initialDate ? parseDay(initialDate) : null;
  const [tab, setTab] = useState<"cal" | "list">("cal");
  const [ym, setYm] = useState(() => {
    const base = init ?? t;
    return base.getFullYear() * 12 + base.getMonth();
  });
  const [sel, setSel] = useState<Date | null>(init);
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | CalType>("all");
  const [st, setSt] = useState<"all" | "Upcoming" | "Ongoing" | "Completed">("all");
  const [detail, setDetail] = useState<CalEvent | null>(null);
  const [adding, setAdding] = useState(false);

  const lo = t.getFullYear() * 12 + t.getMonth() - 1;
  const hi = lo + 4;

  return (
    <>
      <Card>
        <div className="evtop">
          <SegTabs
            tabs={[
              { key: "cal", label: "Calendar" },
              { key: "list", label: "Event Schedule" },
            ]}
            value={tab}
            onChange={setTab}
          />
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            {tab === "cal" && (
              <div className="evlg" aria-label="Legend">
                <b>Legend</b>
                {Object.values(TC).map((x) => (
                  <span key={x[2]}>
                    <i style={{ background: x[0] }} />
                    {x[2]}
                  </span>
                ))}
                <span>
                  <i className="td" />
                  Today
                </span>
              </div>
            )}
            {canManage && (
              <Btn sm onClick={() => setAdding(true)}>
                ＋ Add event
              </Btn>
            )}
          </div>
        </div>
        {tab === "cal" ? (
          <CalendarView
            events={events}
            today={t}
            ym={ym}
            setYm={(v) => {
              setYm(Math.max(lo, Math.min(hi, v)));
              setSel(null);
            }}
            canPrev={ym > lo}
            canNext={ym < hi}
            sel={sel}
            setSel={setSel}
            open={setDetail}
          />
        ) : (
          <ListView events={events} today={t} q={q} setQ={setQ} type={type} setType={setType} st={st} setSt={setSt} open={setDetail} />
        )}
      </Card>
      {detail && <Detail e={detail} today={t} onClose={() => setDetail(null)} canManage={canManage} extras={extras[detail.id]} />}
      {adding && (
        <AddEvent
          programs={programs}
          today={today}
          onClose={() => setAdding(false)}
          onAdded={(day) => {
            const d = parseDay(day);
            setSel(d);
            setYm(d.getFullYear() * 12 + d.getMonth());
            setTab("cal");
          }}
        />
      )}
    </>
  );
}

function CalendarView({
  events,
  today,
  ym,
  setYm,
  canPrev,
  canNext,
  sel,
  setSel,
  open,
}: {
  events: CalEvent[];
  today: Date;
  ym: number;
  setYm: (v: number) => void;
  canPrev: boolean;
  canNext: boolean;
  sel: Date | null;
  setSel: (d: Date | null) => void;
  open: (e: CalEvent) => void;
}) {
  const y = Math.floor(ym / 12);
  const m = ym % 12;
  const first = new Date(y, m, 1);
  const dim = new Date(y, m + 1, 0).getDate();
  const pdim = new Date(y, m, 0).getDate();
  const cells: React.ReactNode[] = [];
  for (let i = first.getDay(); i > 0; i--)
    cells.push(
      <div key={`p${i}`} className="cell o">
        <span className="n">{pdim - i + 1}</span>
      </div>,
    );
  for (let d = 1; d <= dim; d++) {
    const dt = new Date(y, m, d);
    const on = evOn(events, dt);
    cells.push(
      <div
        key={d}
        className={`cell${+dt === +today ? " today" : ""}${sel && +dt === +sel ? " sel" : ""}`}
        onClick={() => setSel(dt)}
      >
        <span className="n">{d}</span>
        {on.slice(0, 2).map((e) => (
          <span key={e.id} className="chip2" style={{ background: TC[e.type][0] }} title={e.title}>
            {e.title}
          </span>
        ))}
        {on.length > 2 && <span style={{ fontSize: 10, color: "var(--muted)" }}>+{on.length - 2} more</span>}
      </div>,
    );
  }
  const tot = first.getDay() + dim;
  for (let i = 1; i <= (7 - (tot % 7)) % 7; i++)
    cells.push(
      <div key={`n${i}`} className="cell o">
        <span className="n">{i}</span>
      </div>,
    );

  const list = sel
    ? evOn(events, sel)
    : events
        .filter((e) => evEnd(e) >= today && evStart(e).getFullYear() * 12 + evStart(e).getMonth() <= ym + 2);

  return (
    <div className="calw">
      <div className="bigcal">
        <div className="ch2">
          <button type="button" onClick={() => setYm(ym - 1)} disabled={!canPrev} style={canPrev ? undefined : { opacity: 0.3 }} aria-label="Previous month">
            ‹
          </button>
          <b>
            {MONL[m]} {y}
          </b>
          <button type="button" onClick={() => setYm(ym + 1)} disabled={!canNext} style={canNext ? undefined : { opacity: 0.3 }} aria-label="Next month">
            ›
          </button>
        </div>
        <div className="bg7">
          {WD.map((w) => (
            <div key={w} className="wd">
              {w}
            </div>
          ))}
          {cells}
        </div>
      </div>
      <div className="dayp">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h4 style={{ margin: 0 }}>{sel ? `${WD[sel.getDay()]}, ${fmt(sel)}` : "Coming up"}</h4>
          {sel && (
            <a className="lnk" role="button" onClick={() => setSel(null)}>
              Clear
            </a>
          )}
        </div>
        {list.length ? (
          list.map((e) => {
            const s = evStatus(e, today);
            return (
              <div key={e.id} className="dayev" style={{ borderLeftColor: TC[e.type][0] }} onClick={() => open(e)}>
                <span className="pill" style={{ background: TC[e.type][1], color: TC[e.type][0] }}>
                  {TC[e.type][3]} {TC[e.type][2]}
                </span>
                <b style={{ marginTop: 6 }}>{e.title}</b>
                <div>
                  🗓 {rangeLabel(e)} · {e.time}
                </div>
                <div>📍 {e.where}</div>
                <div>
                  🎓 {e.prog} · <b style={{ color: s === "Completed" ? "#1b7a30" : "#8a6d00", display: "inline" }}>{s}</b>
                </div>
              </div>
            );
          })
        ) : (
          <Empty icon="🌤" compact>
            No events on this day.
          </Empty>
        )}
      </div>
    </div>
  );
}

function ListView({
  events,
  today,
  q,
  setQ,
  type,
  setType,
  st,
  setSt,
  open,
}: {
  events: CalEvent[];
  today: Date;
  q: string;
  setQ: (v: string) => void;
  type: "all" | CalType;
  setType: (v: "all" | CalType) => void;
  st: "all" | "Upcoming" | "Ongoing" | "Completed";
  setSt: (v: "all" | "Upcoming" | "Ongoing" | "Completed") => void;
  open: (e: CalEvent) => void;
}) {
  const cnt = (s: string) => events.filter((e) => evStatus(e, today) === s).length;
  const range = useMemo(() => {
    if (!events.length) return "";
    const a = evStart(events[0]);
    const b = evEnd(events[events.length - 1]);
    return a.getFullYear() === b.getFullYear() ? `${MON[a.getMonth()]} – ${MON[b.getMonth()]} ${b.getFullYear()}` : `${MON[a.getMonth()]} ${a.getFullYear()} – ${MON[b.getMonth()]} ${b.getFullYear()}`;
  }, [events]);
  const rows = events.filter(
    (e) =>
      (type === "all" || e.type === type) &&
      (st === "all" || evStatus(e, today) === st) &&
      (!q || `${e.title}${e.prog}${e.where}`.toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <>
      <StatGrid>
        {(
          [
            ["Upcoming", cnt("Upcoming"), "#fff6d6", "⏳"],
            ["Ongoing", cnt("Ongoing"), "#e8eefb", "▶"],
            ["Completed", cnt("Completed"), "#e9f7ec", "✓"],
            ["Total events", events.length, "#f6eaea", "🗓"],
          ] as const
        ).map(([l, n, bg, ic]) => (
          <StatTile key={l} flat label={l} value={n} sub={range} icon={ic} iconBg={bg} />
        ))}
      </StatGrid>
      <div className="ch">
        <SearchBox variant="pill" value={q} onChange={setQ} placeholder="Search events" />
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label className="fl" style={{ margin: 0 }}>
            Type
          </label>
          <select className="inp" style={{ width: "auto" }} value={type} onChange={(e) => setType(e.target.value as "all" | CalType)}>
            <option value="all">All</option>
            {(Object.keys(TC) as CalType[]).map((k) => (
              <option key={k} value={k}>
                {TC[k][2]}
              </option>
            ))}
          </select>
          <label className="fl" style={{ margin: 0 }}>
            Status
          </label>
          <select className="inp" style={{ width: "auto" }} value={st} onChange={(e) => setSt(e.target.value as typeof st)}>
            {(["all", "Upcoming", "Ongoing", "Completed"] as const).map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All" : s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Event</th>
            <th>Program</th>
            <th>Location</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((e) => {
              const s = evStatus(e, today);
              return (
                <tr key={e.id} className="click" onClick={() => open(e)}>
                  <td>
                    <b>{rangeLabel(e, true)}</b>
                    <small>{e.time}</small>
                  </td>
                  <td>
                    <span style={{ color: TC[e.type][0] }}>{TC[e.type][3]}</span> {e.title}
                    <small>{TC[e.type][2]}</small>
                  </td>
                  <td>{e.prog}</td>
                  <td>{e.where}</td>
                  <td>
                    <span className={`pill ${s === "Completed" ? "p-ok" : s === "Ongoing" ? "p-blue" : "p-pend"}`}>{s}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className="lnk">Details ›</span>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6}>
                <Empty>No events match your filters.</Empty>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}

function Detail({
  e,
  today,
  onClose,
  canManage,
  extras,
}: {
  e: CalEvent;
  today: Date;
  onClose: () => void;
  canManage?: boolean;
  extras?: EventExtra[];
}) {
  const [c, bg, lb, ic] = TC[e.type];
  const s = evStatus(e, today);
  const n = daysBetween(today, evStart(e));
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const s0 = evStart(e);
  const e0 = evEnd(e);
  const date =
    e.end && e.end !== e.start
      ? `${WD[s0.getDay()]}–${WD[e0.getDay()]}, ${rangeLabel(e, true)}`
      : `${WD[s0.getDay()]}, ${fmt(s0)}`;
  const removable = canManage && e.removable;
  return (
    <Modal
      onClose={onClose}
      head={
        <div className="md-h" style={{ borderTop: `6px solid ${c}`, borderRadius: "20px 20px 0 0" }}>
          <button type="button" className="x" onClick={onClose} aria-label="Close">
            ×
          </button>
          <span className="pill" style={{ background: bg, color: c }}>
            {ic} {lb}
          </span>
          <h3 style={{ marginTop: 8 }}>{e.title}</h3>
          <p>
            {s}
            {s === "Upcoming" ? ` · ${cdTxt(n)}` : ""}
          </p>
        </div>
      }
      footer={
        <>
          {removable ? (
            <Btn
              variant="gh"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await cancelEvent(e.id);
                  if (!r.ok) return toast.say(r.error, true);
                  onClose();
                  toast.say("Event removed");
                  router.refresh();
                })
              }
            >
              🗑 Remove
            </Btn>
          ) : (
            <Btn variant="o" href={icsHref(e)} download={`${e.title.replace(/[^\w]+/g, "-")}.ics`} onClick={() => toast.say("Added to your calendar (.ics)")}>
              📅 Add to calendar
            </Btn>
          )}
          <Btn onClick={onClose}>Close</Btn>
        </>
      }
    >
      <SumRows
        flush
        rows={[
          ["Date", date],
          ["Time", e.time],
          ["Location", e.where],
          ["Program", e.prog],
          ["Participants", e.part],
        ]}
      />
      {extras?.map((x) => (
        <div key={x.title} className="evb" style={{ margin: "14px 0 0", padding: "12px 16px" }}>
          <div className="i" style={{ width: 36, height: 36, fontSize: 17 }}>
            {x.icon}
          </div>
          <div>
            <b style={{ fontSize: 13.5 }}>{x.title}</b>
            <p>{x.sub}</p>
          </div>
          <div className="a">
            <Btn sm href={x.href}>
              {x.action}
            </Btn>
          </div>
        </div>
      ))}
    </Modal>
  );
}

function AddEvent({
  programs,
  today,
  onClose,
  onAdded,
}: {
  programs: { id: string; short: string }[];
  today: string;
  onClose: () => void;
  onAdded: (day: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CalType>("dead");
  const [prog, setProg] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("9:00 AM – 12:00 NN");
  const [where, setWhere] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <Modal
      title="Add event"
      sub="Program reps and accreditors of the selected program are notified"
      onClose={onClose}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            disabled={pending}
            onClick={() => {
              if (!title.trim() || !date) return toast.say("Enter a title and date", true);
              start(async () => {
                const r = await createPortalEvent({ title: title.trim(), type, programId: prog || null, date, time, where });
                if (!r.ok) return toast.say(r.error, true);
                onClose();
                onAdded(date);
                toast.say("Event added and participants notified");
                router.refresh();
              });
            }}
          >
            Add event
          </Btn>
        </>
      }
    >
      <label className="fl">Title *</label>
      <input className="inp" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mock accreditation · BSIT" />
      <div className="fg2">
        <div>
          <label className="fl">Type</label>
          <select className="inp" value={type} onChange={(e) => setType(e.target.value as CalType)}>
            {(Object.keys(TC) as CalType[]).map((k) => (
              <option key={k} value={k}>
                {TC[k][2]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="fl">Program</label>
          <select className="inp" value={prog} onChange={(e) => setProg(e.target.value)}>
            <option value="">All</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.short}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="fl">Date *</label>
          <input className="inp" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="fl">Time</label>
          <input className="inp" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <label className="fl">Location</label>
      <input className="inp" value={where} onChange={(e) => setWhere(e.target.value)} placeholder="e.g. QAC Conference Room" />
    </Modal>
  );
}

