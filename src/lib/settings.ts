import { createClient } from "@/lib/supabase/server";
import { fileSize, manilaTime, personName, programShort, shortDate } from "@/lib/program-names";
import { DEFAULTS, type SettingKey } from "@/lib/settings-model";
import { getQacOverview, phaseCounts } from "@/lib/qac-portal";

type Supa = Awaited<ReturnType<typeof createClient>>;

export async function getSetting<K extends SettingKey>(supabase: Supa, key: K): Promise<(typeof DEFAULTS)[K]> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  return { ...DEFAULTS[key], ...((data?.value as object | null) ?? {}) } as (typeof DEFAULTS)[K];
}

const DONE = ["evaluated", "score_returned", "declined"];

export type CycleRow = { id: string; name: string; start: string; end: string; status: string; closedAt: string | null; closedBy: string | null };
export type CyclesData = { cycles: CycleRow[]; inproc: number; docs: number; reports: number; today: string };

export async function getCyclesData(): Promise<CyclesData> {
  const supabase = await createClient();
  const [{ data: cycles }, { programs }] = await Promise.all([
    supabase.from("accreditation_cycles").select("id, name, start_date, end_date, status, closed_at, profiles:closed_by(surname, given_name)").order("start_date", { ascending: false }),
    getQacOverview(),
  ]);
  const ong = programs.filter((p) => p.inproc);
  const inproc = ong.length;
  const docs = ong.reduce((s, p) => s + phaseCounts(p).pe, 0);
  const reports = ong.reduce((s, p) => s + p.reports.filter((r) => r.status === "submitted").length, 0);
  return {
    cycles: (cycles ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      start: c.start_date,
      end: c.end_date,
      status: c.status,
      closedAt: c.closed_at,
      closedBy: c.profiles ? personName(c.profiles) : null,
    })),
    inproc,
    docs,
    reports,
    today: new Date().toISOString().slice(0, 10),
  };
}

export type SetupData = {
  levels: { id: string; name: string }[];
  areas: { id: string; name: string; levelId: string }[];
  psvLevelId: string | null;
  phases: { id: string; name: string; docs: { id: string; name: string }[] }[];
  rules: typeof DEFAULTS.rules;
};

export async function getSetupData(): Promise<SetupData> {
  const supabase = await createClient();
  const [{ data: levels }, { data: areas }, { data: phases }, { data: pdocs }, rules] = await Promise.all([
    supabase.from("accreditation_levels").select("id, code, name").order("ordinal"),
    supabase.from("requirement_areas").select("id, name, level_id, ordinal").order("ordinal"),
    supabase.from("phases").select("id, name, ordinal").order("ordinal"),
    supabase.from("phase_documents").select("id, name, phase_id, ordinal").order("ordinal"),
    getSetting(supabase, "rules"),
  ]);
  const psv = (levels ?? []).find((l) => l.code === "PSV")?.id ?? null;
  return {
    levels: (levels ?? []).map((l) => ({ id: l.id, name: l.name })),
    areas: (areas ?? []).filter((a) => a.level_id === psv).map((a) => ({ id: a.id, name: a.name, levelId: a.level_id })),
    psvLevelId: psv,
    phases: (phases ?? []).map((p) => ({ id: p.id, name: p.name, docs: (pdocs ?? []).filter((d) => d.phase_id === p.id).map((d) => ({ id: d.id, name: d.name })) })),
    rules,
  };
}

export type UserRow = {
  id: string;
  name: string;
  surname: string;
  given: string;
  email: string;
  role: string;
  ia: boolean;
  status: "active" | "invited" | "inactive";
  last: string;
  me: boolean;
  sys: boolean;
  assigned: string[];
  positionId: string | null;
  position: string | null;
};

export type PositionOption = { id: string; name: string; scope: "program" | "qac" };
export type UsersData = { users: UserRow[]; positions: PositionOption[] };

export async function getUsersData(meId: string): Promise<UsersData> {
  const supabase = await createClient();
  const [{ data: people }, { data: inv }, { data: last }, { data: team }, { data: positions }] = await Promise.all([
    supabase.from("profiles").select("id, surname, given_name, middle_initial, webmail, role, is_active, is_internal_accreditor, position_id, positions(name)").is("deleted_at", null).order("surname"),
    supabase.from("user_invitations").select("id, webmail, surname, given_name, role, is_internal_accreditor, invited_at"),
    supabase.rpc("admin_last_activity"),
    supabase.from("assignment_accreditors").select("profile_id, response, assignments(status, submissions(programs(name)))").neq("response", "rejected"),
    supabase.from("positions").select("id, name, scope").order("name"),
  ]);
  const lastMap = new Map((last ?? []).map((r) => [r.profile_id, r.last_at]));
  const today = new Date().toISOString().slice(0, 10);
  const lastLabel = (iso: string | undefined) => (!iso ? "—" : iso.slice(0, 10) === today ? `Today, ${manilaTime(iso)}` : shortDate(iso));
  const mailer = (process.env.MAILER_EMAIL ?? "").toLowerCase();
  const emails = new Set((people ?? []).map((p) => p.webmail.toLowerCase()));
  const rows: UserRow[] = (people ?? []).map((p) => ({
    id: p.id,
    name: personName(p),
    surname: p.surname,
    given: p.given_name,
    email: p.webmail,
    role: p.role,
    ia: p.is_internal_accreditor,
    status: p.is_active ? "active" : "inactive",
    last: lastLabel(lastMap.get(p.id)),
    me: p.id === meId,
    sys: Boolean(mailer) && p.webmail.toLowerCase() === mailer,
    assigned: (team ?? [])
      .filter((t) => t.profile_id === p.id && t.assignments && !DONE.includes(t.assignments.status))
      .map((t) => programShort(t.assignments?.submissions?.programs?.name ?? "")),
    positionId: p.position_id,
    position: p.positions?.name ?? null,
  }));
  for (const i of inv ?? []) {
    if (emails.has(i.webmail.toLowerCase())) continue;
    rows.push({
      id: i.id,
      name: `${i.surname}, ${i.given_name}`,
      surname: i.surname,
      given: i.given_name,
      email: i.webmail,
      role: i.role,
      ia: i.is_internal_accreditor,
      status: "invited",
      last: `Invited ${shortDate(i.invited_at)}`,
      me: false,
      sys: false,
      assigned: [],
      positionId: null,
      position: null,
    });
  }
  return { users: rows, positions: positions ?? [] };
}

export type RepsData = {
  reps: { id: string; name: string; invited: boolean }[];
  map: Record<string, { id: string; name: string; campus: string }[]>;
  programs: { id: string; name: string; college: string; campus: string; rep: string | null }[];
};

export async function getRepsData(): Promise<RepsData> {
  const supabase = await createClient();
  const [{ data: people }, { data: links }, { data: programs }] = await Promise.all([
    supabase.from("profiles").select("id, surname, given_name, middle_initial, role").eq("role", "program_representative").is("deleted_at", null).order("surname"),
    supabase.from("program_reps").select("profile_id, program_id, profiles(surname, given_name, middle_initial)"),
    supabase.from("programs").select("id, name, campuses(name), colleges(code)").is("deleted_at", null).order("name"),
  ]);
  const P = (programs ?? []).map((p) => ({ id: p.id, name: p.name, college: p.colleges?.code ?? "NA", campus: p.campuses?.name ?? "—" }));
  const map: RepsData["map"] = {};
  const repOf = new Map<string, string>();
  for (const l of links ?? []) {
    const p = P.find((x) => x.id === l.program_id);
    if (!p) continue;
    (map[l.profile_id] ??= []).push({ id: p.id, name: p.name, campus: p.campus });
    if (!repOf.has(p.id)) repOf.set(p.id, personName(l.profiles));
  }
  const ids = new Set((people ?? []).map((p) => p.id));
  const reps = (people ?? []).map((p) => ({ id: p.id, name: personName(p), invited: false }));
  for (const l of links ?? []) if (!ids.has(l.profile_id)) {
    ids.add(l.profile_id);
    reps.push({ id: l.profile_id, name: personName(l.profiles), invited: false });
  }
  return { reps, map, programs: P.map((p) => ({ ...p, rep: repOf.get(p.id) ?? null })) };
}

export type ProgsData = {
  colleges: { id: string; code: string; name: string }[];
  campuses: { id: string; name: string; main: boolean }[];
  programs: { id: string; name: string; collegeId: string | null; college: string; campus: string; alsoAt: string[]; hasRep: boolean }[];
};

export async function getProgsData(): Promise<ProgsData> {
  const supabase = await createClient();
  const [{ data: colleges }, { data: campuses }, { data: programs }, { data: links }] = await Promise.all([
    supabase.from("colleges").select("id, code, name").order("code"),
    supabase.from("campuses").select("id, name, is_main").order("is_main", { ascending: false }).order("name"),
    supabase.from("programs").select("id, name, college_id, campuses(name), colleges(code)").is("deleted_at", null).order("name"),
    supabase.from("program_reps").select("program_id"),
  ]);
  const has = new Set((links ?? []).map((l) => l.program_id));
  const key = (n: string) => n.trim().toLowerCase().replace(/\s+/g, " ");
  const offered = new Map<string, { id: string; campus: string }[]>();
  for (const p of programs ?? []) {
    const k = key(p.name);
    offered.set(k, [...(offered.get(k) ?? []), { id: p.id, campus: p.campuses?.name ?? "—" }]);
  }
  return {
    colleges: colleges ?? [],
    campuses: (campuses ?? []).map((c) => ({ id: c.id, name: c.name, main: c.is_main })),
    programs: (programs ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      collegeId: p.college_id,
      college: p.colleges?.code ?? "NA",
      campus: p.campuses?.name ?? "—",
      alsoAt: (offered.get(key(p.name)) ?? []).filter((o) => o.id !== p.id).map((o) => o.campus),
      hasRep: has.has(p.id),
    })),
  };
}

export type Announcement = { id: string; title: string; body: string | null; date: string; publishOn: string; pinned: boolean; published: boolean; audience: string };
export type PublicData = {
  info: typeof DEFAULTS.public;
  announcements: Announcement[];
  accredited: { id: string; name: string; short: string; campus: string; level: string; to: string | null }[];
  today: string;
};

export async function getPublicData(): Promise<PublicData> {
  const supabase = await createClient();
  const [info, { data: ann }, { data: awards }] = await Promise.all([
    getSetting(supabase, "public"),
    supabase.from("announcements").select("id, title, body, created_at, publish_on, is_pinned, is_published, audience").order("is_pinned", { ascending: false }).order("created_at", { ascending: false }),
    supabase
      .from("program_accreditations")
      .select("program_id, valid_until, programs(name, campuses(name)), accreditation_levels!level_id(name)")
      .eq("status", "active")
      .order("valid_until"),
  ]);
  return {
    info,
    announcements: (ann ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      date: shortDate(a.created_at),
      publishOn: a.publish_on,
      pinned: a.is_pinned,
      published: a.is_published,
      audience: a.audience,
    })),
    accredited: [...new Map((awards ?? []).map((a) => [a.program_id, a])).values()].map((a) => ({
      id: a.program_id,
      name: a.programs?.name ?? "—",
      short: programShort(a.programs?.name ?? ""),
      campus: a.programs?.campuses?.name ?? "—",
      level: a.accreditation_levels?.name ?? "—",
      to: a.valid_until,
    })),
    today: new Date().toISOString().slice(0, 10),
  };
}

export type EmailData = {
  groups: { subject: string; n: number; sample: { to: string; subject: string; body: string } }[];
  queued: number;
  sentToday: number;
  failed: number;
  notify: Record<string, boolean>;
};

export async function getEmailData(): Promise<EmailData> {
  const supabase = await createClient();
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  today.setHours(0, 0, 0, 0);
  const [{ data: pending }, { count: sent }, { count: failed }, notify] = await Promise.all([
    supabase.from("email_outbox").select("to_email, subject, body").eq("status", "pending").order("created_at").limit(1000),
    supabase.from("email_outbox").select("id", { count: "exact", head: true }).eq("status", "sent").gte("sent_at", today.toISOString()),
    supabase.from("email_outbox").select("id", { count: "exact", head: true }).eq("status", "failed"),
    getSetting(supabase, "notify"),
  ]);
  const by = new Map<string, EmailData["groups"][number]>();
  for (const e of pending ?? []) {
    const key = e.subject.replace(/^\[QAC-WARDS\]\s*/, "").replace(/\s*[:·—-]\s.*$/, "");
    const g = by.get(key);
    if (g) g.n++;
    else by.set(key, { subject: key, n: 1, sample: { to: e.to_email, subject: e.subject, body: e.body } });
  }
  return { groups: [...by.values()].sort((a, b) => b.n - a.n), queued: pending?.length ?? 0, sentToday: sent ?? 0, failed: failed ?? 0, notify };
}

export type BackupRow = { id: string; date: string; time: string; kind: string; note: string | null; by: string | null; size: string; ok: boolean; log: string | null; hasFile: boolean };
export type BackupData = { rows: BackupRow[]; prefs: typeof DEFAULTS.backup; used: string; usedPct: number };

export async function getBackupData(): Promise<BackupData> {
  const supabase = await createClient();
  const [{ data: rows }, prefs, { data: used }] = await Promise.all([
    supabase.from("system_backups").select("id, created_at, kind, note, size_bytes, status, log, storage_path, profiles:created_by(surname, given_name)").order("created_at", { ascending: false }).limit(50),
    getSetting(supabase, "backup"),
    supabase.rpc("admin_storage_usage"),
  ]);
  const bytes = Number(used ?? 0);
  const quota = 100 * 1024 ** 3;
  return {
    rows: (rows ?? []).map((b) => ({
      id: b.id,
      date: shortDate(b.created_at),
      time: manilaTime(b.created_at),
      kind: b.kind === "automatic" ? "Automatic" : "Manual",
      note: b.note,
      by: b.profiles ? personName(b.profiles) : null,
      size: b.size_bytes ? fileSize(b.size_bytes) : "—",
      ok: b.status === "ok",
      log: b.log,
      hasFile: Boolean(b.storage_path),
    })),
    prefs,
    used: `${(bytes / 1024 ** 3).toFixed(1)} / 100 GB`,
    usedPct: Math.min(100, Math.round((bytes / quota) * 100)),
  };
}

export type SessionRow = { id: string; userId: string; who: string; device: string; seen: string; me: boolean };
export type SecurityData = { sec: typeof DEFAULTS.security; sessions: SessionRow[] };

function device(ua: string | null) {
  if (!ua) return "Unknown device";
  const b = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const o = /Windows/.test(ua) ? "Windows" : /iPhone|iPad/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return [b, o].filter(Boolean).join(" · ");
}

function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 2) return "Now";
  if (m < 60) return `${m} min ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)} h ago`;
  if (m < 60 * 48) return "Yesterday";
  return shortDate(iso);
}

export async function getSecurityData(meId: string): Promise<SecurityData> {
  const supabase = await createClient();
  const [sec, { data: sessions }, { data: people }] = await Promise.all([
    getSetting(supabase, "security"),
    supabase.rpc("admin_sessions"),
    supabase.from("profiles").select("id, surname, given_name"),
  ]);
  const name = new Map((people ?? []).map((p) => [p.id, personName(p)]));
  return {
    sec,
    sessions: (sessions ?? []).filter((s, i, all) => all.findIndex((x) => x.user_id === s.user_id) === i).map((s) => ({
      id: s.id,
      userId: s.user_id,
      who: `${name.get(s.user_id) ?? "Unknown user"}${s.user_id === meId ? " (you)" : ""}`,
      device: [device(s.user_agent), s.ip].filter(Boolean).join(" · "),
      seen: ago(s.last_seen),
      me: s.user_id === meId,
    })),
  };
}
