import { createClient } from "@/lib/supabase/server";
import { getSubmissionReviews } from "@/lib/reviews";
import { initialsOf, personName, programMid, programShort, shortDate } from "@/lib/program-names";
import type { QacProgram, QacReport } from "@/lib/qac-model";
export * from "@/lib/qac-model";

const ACTIVE = ["not_started", "in_progress", "submitted", "under_evaluation", "returned"];

export type QacOverview = {
  programs: QacProgram[];
  totals: { offered: number; main: number; other: number; campuses: number; copc: number };
};

export async function getQacOverview(): Promise<QacOverview> {
  const supabase = await createClient();
  const [{ data: programs }, { data: subs }, { data: awardRows }, { data: copcFolder }, { data: reps }] = await Promise.all([
    supabase.from("programs").select("id, name, campuses(name, is_main), colleges(code, name)").is("deleted_at", null),
    supabase
      .from("submissions")
      .select(
        `id, program_id, level_id, status, attempt, updated_at,
         accreditation_levels(code, name, ordinal),
         assignments(id, status, site_visit_date, due_date,
           assignment_accreditors(profile_id, response, acting_reason, profiles(surname, given_name, middle_initial)),
           evaluations(outcome, released_at))`,
      )
      .order("updated_at", { ascending: false }),
    supabase
      .from("program_accreditations")
      .select("program_id, status, granted_on, valid_until, accreditation_levels!level_id(code, name, ordinal)")
      .in("status", ["active", "superseded", "expired"]),
    supabase.from("repository_folders").select("id").eq("slug", "certificate-of-compliance-copc-certificate").maybeSingle(),
    supabase.from("program_reps").select("program_id, profiles(surname, given_name, middle_initial)"),
  ]);

  const { data: copcFiles } = copcFolder
    ? await supabase.from("repository_files").select("program_id").eq("folder_id", copcFolder.id).eq("is_archived", false)
    : { data: [] as { program_id: string }[] };
  const copcSet = new Set((copcFiles ?? []).map((f) => f.program_id));

  const { data: certs } = await supabase
    .from("repository_files")
    .select("program_id, valid_from, valid_until, accreditation_levels(code, name, ordinal), repository_folders!inner(slug)")
    .eq("is_archived", false)
    .eq("repository_folders.slug", "aaccup-certificate")
    .not("valid_until", "is", null)
    .not("level_id", "is", null);
  const awarded = new Set((awardRows ?? []).filter((a) => a.status === "active").map((a) => a.program_id));
  const certBest = new Map<string, NonNullable<typeof certs>[number]>();
  for (const c of certs ?? []) {
    if (awarded.has(c.program_id)) continue;
    const cur = certBest.get(c.program_id);
    const rank = (x: typeof c) => `${String(x.accreditation_levels?.ordinal ?? 0).padStart(2, "0")}${x.valid_until}`;
    if (!cur || rank(c) > rank(cur)) certBest.set(c.program_id, c);
  }
  const awards = [
    ...(awardRows ?? []),
    ...[...certBest.values()].map((c) => ({ program_id: c.program_id, status: "active", granted_on: c.valid_from, valid_until: c.valid_until, accreditation_levels: c.accreditation_levels })),
  ];

  const active = new Map<string, NonNullable<typeof subs>[number]>();
  for (const s of subs ?? []) {
    const asg = Array.isArray(s.assignments) ? s.assignments[0] : s.assignments;
    const live = ACTIVE.includes(s.status) || (asg && asg.status !== "score_returned" && asg.status !== "declined");
    if (!live) continue;
    const cur = active.get(s.program_id);
    if (!cur || (s.accreditation_levels?.ordinal ?? 0) > (cur.accreditation_levels?.ordinal ?? 0)) active.set(s.program_id, s);
  }

  const reviews = await getSubmissionReviews([...active.values()].map((s) => s.id));
  const assignmentIds = [...active.values()]
    .map((s) => (Array.isArray(s.assignments) ? s.assignments[0] : s.assignments)?.id)
    .filter((x): x is string => Boolean(x));
  const [{ data: reports }, { data: ratings }] = assignmentIds.length
    ? await Promise.all([
        supabase
          .from("accreditor_reports")
          .select("assignment_id, accreditor_id, status, grand_mean, signed_at, doc_code, qac_note, overall_findings, recommendation")
          .in("assignment_id", assignmentIds),
        supabase.from("area_ratings").select("assignment_id, accreditor_id, requirement_area_id, rating, remark").in("assignment_id", assignmentIds),
      ])
    : [{ data: [] as never[] }, { data: [] as never[] }];

  const out: QacProgram[] = [];
  for (const p of programs ?? []) {
    const s = active.get(p.id);
    const aw = (awards ?? []).filter((a) => a.program_id === p.id);
    const current = aw.filter((a) => a.status === "active").sort((a, b) => (b.accreditation_levels?.ordinal ?? 0) - (a.accreditation_levels?.ordinal ?? 0))[0];
    if (!s && !current) continue;
    const asg = s ? (Array.isArray(s.assignments) ? s.assignments[0] : s.assignments) : null;
    type M = { profile_id: string; response: string; acting_reason: string | null; profiles: { surname: string; given_name: string; middle_initial: string | null } | null };
    const team = ((asg?.assignment_accreditors ?? []) as M[]).map((m) => {
      const name = personName(m.profiles);
      return { id: m.profile_id, name, surname: m.profiles?.surname ?? name, initials: initialsOf(name), response: m.response, acting: m.acting_reason };
    });
    const rep = (reps ?? []).find((r) => r.program_id === p.id);
    const myReports: QacReport[] = (reports ?? [])
      .filter((r) => r.assignment_id === asg?.id)
      .map((r) => ({
        accreditorId: r.accreditor_id,
        status: r.status as QacReport["status"],
        grandMean: r.grand_mean,
        signedAt: r.signed_at,
        code: r.doc_code,
        qacNote: r.qac_note,
        findings: r.overall_findings ?? "",
        recommendation: r.recommendation ?? "",
      }));
    const rated: Record<string, number> = {};
    const areaMeans: Record<string, Record<string, number>> = {};
    const remarks: Record<string, Record<string, string[]>> = {};
    for (const m of team) {
      const mine = (ratings ?? []).filter((r) => r.assignment_id === asg?.id && r.accreditor_id === m.id);
      const byArea = new Map<string, number[]>();
      for (const r of mine) if (r.rating) byArea.set(r.requirement_area_id, [...(byArea.get(r.requirement_area_id) ?? []), r.rating]);
      areaMeans[m.id] = Object.fromEntries([...byArea].map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / v.length]));
      remarks[m.id] = {};
      for (const r of mine) if (r.remark?.trim()) (remarks[m.id][r.requirement_area_id] ??= []).push(r.remark.trim());
      const rows = (ratings ?? []).filter((r) => r.assignment_id === asg?.id && r.accreditor_id === m.id && r.rating);
      const perArea = new Map<string, number>();
      for (const r of rows) perArea.set(r.requirement_area_id, (perArea.get(r.requirement_area_id) ?? 0) + 1);
      rated[m.id] = [...perArea.values()].filter((n) => n >= 3).length;
    }
    const ev = asg ? (Array.isArray(asg.evaluations) ? asg.evaluations[0] : asg.evaluations) : null;
    const lvl = s?.accreditation_levels ?? current?.accreditation_levels;
    out.push({
      id: p.id,
      name: p.name,
      short: programShort(p.name),
      mid: programMid(p.name),
      college: p.colleges?.code ?? "NA",
      collegeName: p.colleges?.name ?? "Not Applicable (campus program)",
      campus: p.campuses?.name ?? "—",
      isMain: Boolean(p.campuses?.is_main),
      levelCode: lvl?.code ?? "",
      levelName: lvl?.name ?? "—",
      levelId: s?.level_id ?? "",
      inproc: Boolean(s),
      submissionId: s?.id ?? null,
      submissionStatus: s?.status ?? null,
      assignmentId: asg?.id ?? null,
      assignmentStatus: asg?.status ?? null,
      visit: asg?.site_visit_date ?? null,
      visitLabel: asg?.site_visit_date ? shortDate(asg.site_visit_date) : "Not scheduled",
      due: asg?.due_date ?? null,
      team,
      rep: rep?.profiles ? personName(rep.profiles) : "—",
      review: s ? (reviews.find((r) => r.submissionId === s.id) ?? null) : null,
      reports: myReports,
      rated,
      areaMeans,
      remarks,
      result: ev?.outcome ? (ev.outcome === "passed" ? `Passed ${lvl?.name ?? ""}`.trim() : "Deferred") : null,
      from: current?.granted_on ?? null,
      to: current?.valid_until ?? null,
      copc: copcSet.has(p.id),
      awardedCodes: aw.filter((a) => a.status === "active" || a.status === "superseded").map((a) => a.accreditation_levels?.code ?? "").filter(Boolean),
    });
  }
  out.sort((a, b) => Number(b.inproc) - Number(a.inproc) || a.name.localeCompare(b.name));

  const all = programs ?? [];
  const main = all.filter((p) => p.campuses?.is_main).length;
  return {
    programs: out,
    totals: {
      offered: all.length,
      main,
      other: all.length - main,
      campuses: new Set(all.filter((p) => !p.campuses?.is_main).map((p) => p.campuses?.name)).size,
      copc: copcSet.size,
    },
  };
}

export type AssignForm = {
  campuses: string[];
  colleges: { code: string; name: string }[];
  programs: { id: string; name: string; college: string; campus: string }[];
  levels: { id: string; code: string; name: string }[];
  people: { id: string; name: string; college: string; expertise: string[]; qac: boolean; position: string }[];
  busy: { id: string; date: string; short: string; assignmentId: string }[];
  load: Record<string, number>;
  me: string;
};

export async function getAssignFormData(meId: string): Promise<AssignForm> {
  const supabase = await createClient();
  const [{ data: campuses }, { data: colleges }, { data: programs }, { data: levels }, { data: people }, { data: team }] = await Promise.all([
    supabase.from("campuses").select("name, is_main").order("is_main", { ascending: false }).order("name"),
    supabase.from("colleges").select("code, name").order("code"),
    supabase.from("programs").select("id, name, colleges(code), campuses(name)").is("deleted_at", null).order("name"),
    supabase.from("accreditation_levels").select("id, code, name").order("ordinal"),
    supabase
      .from("profiles")
      .select("id, surname, given_name, middle_initial, role, is_internal_accreditor, colleges(code), positions(name), accreditor_expertise(expertise_areas(name))")
      .or("role.in.(internal_accreditor,qac_personnel,qac_admin),is_internal_accreditor.eq.true")
      .eq("is_active", true)
      .order("surname"),
    supabase
      .from("assignment_accreditors")
      .select("profile_id, response, assignments(id, status, site_visit_date, submissions(programs(name)))")
      .neq("response", "rejected"),
  ]);
  const busy: AssignForm["busy"] = [];
  const load: Record<string, number> = {};
  for (const t of team ?? []) {
    const a = t.assignments;
    if (!a || a.status === "score_returned" || a.status === "declined") continue;
    load[t.profile_id] = (load[t.profile_id] ?? 0) + 1;
    if (a.site_visit_date) busy.push({ id: t.profile_id, date: a.site_visit_date, short: programShort(a.submissions?.programs?.name ?? ""), assignmentId: a.id });
  }
  return {
    campuses: (campuses ?? []).map((c) => c.name),
    colleges: colleges ?? [],
    programs: (programs ?? []).map((p) => ({ id: p.id, name: p.name, college: p.colleges?.code ?? "NA", campus: p.campuses?.name ?? "—" })),
    levels: levels ?? [],
    people: (people ?? []).filter((p) => p.role !== "qac_admin" || p.is_internal_accreditor).map((p) => ({
      id: p.id,
      name: personName(p),
      college: p.colleges?.code ?? (p.role === "internal_accreditor" ? "—" : "QAC"),
      expertise: (p.accreditor_expertise ?? []).map((e) => e.expertise_areas?.name).filter((x): x is string => Boolean(x)),
      qac: p.role === "qac_personnel" && !p.is_internal_accreditor,
      position: p.positions?.name ?? (p.role === "qac_admin" ? "QAC Admin" : "QA Staff"),
    })),
    busy,
    load,
    me: meId,
  };
}

export type NdaItem = {
  id: string;
  who: string;
  college: string;
  role: string;
  date: string;
  file: string;
  fid: string;
  atty: string;
  nd: string;
  np: string;
  nb: string;
  ns: string;
  status: "review" | "verified" | "returned";
  note: string | null;
};

export async function getNdaQueue(): Promise<NdaItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ndas")
    .select("profile_id, storage_path, uploaded_at, file_id, notary_attorney, notary_doc_no, notary_page_no, notary_book_no, notary_series, status, review_note, profiles!ndas_profile_id_fkey(surname, given_name, middle_initial, colleges(code), positions(name))")
    .order("uploaded_at", { ascending: false });
  return (data ?? []).map((n) => ({
    id: n.profile_id,
    who: personName(n.profiles),
    college: n.profiles?.colleges?.code ?? "—",
    role: n.profiles?.positions?.name ?? "Program representative",
    date: shortDate(n.uploaded_at),
    file: n.storage_path.split("/").pop() ?? "NDA.pdf",
    fid: n.file_id ?? "—",
    atty: n.notary_attorney ?? "—",
    nd: n.notary_doc_no ?? "—",
    np: n.notary_page_no ?? "—",
    nb: n.notary_book_no ?? "—",
    ns: n.notary_series ? String(n.notary_series) : "—",
    status: n.status as NdaItem["status"],
    note: n.review_note,
  }));
}

export type SystemStatus = {
  cycle: { name: string; end: string; days: number } | null;
  queued: number;
  backup: { date: string; time: string; size: string; ok: boolean } | null;
  users: { active: number; inactive: number; invited: number };
  publicLive: boolean;
  announcements: number;
};

export async function getSystemStatus(): Promise<SystemStatus> {
  const supabase = await createClient();
  const [{ data: cycle }, { count: queued }, { data: backup }, { count: active }, { count: inactive }, { data: pub }, { count: ann }] = await Promise.all([
    supabase.from("accreditation_cycles").select("name, end_date").eq("status", "open").maybeSingle(),
    supabase.from("email_outbox").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("system_backups").select("created_at, size_bytes, status").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_active", false),
    supabase.from("site_settings").select("value").eq("key", "public").maybeSingle(),
    supabase.from("announcements").select("id", { count: "exact", head: true }).eq("is_published", true).lte("publish_on", new Date().toISOString().slice(0, 10)),
  ]);
  const [{ data: inv }, { data: mails }] = await Promise.all([supabase.from("user_invitations").select("webmail"), supabase.from("profiles").select("webmail")]);
  const have = new Set((mails ?? []).map((m) => m.webmail.toLowerCase()));
  const invited = (inv ?? []).filter((i) => !have.has(i.webmail.toLowerCase())).length;
  const { fileSize, manilaTime } = await import("@/lib/program-names");
  return {
    cycle: cycle ? { name: cycle.name.replace(" Accreditation Cycle", ""), end: shortDate(cycle.end_date), days: Math.round((new Date(cycle.end_date).getTime() - Date.now()) / 864e5) } : null,
    queued: queued ?? 0,
    backup: backup ? { date: shortDate(backup.created_at), time: manilaTime(backup.created_at), size: fileSize(backup.size_bytes), ok: backup.status === "ok" } : null,
    users: { active: active ?? 0, inactive: inactive ?? 0, invited },
    publicLive: ((pub?.value as { live?: boolean } | null)?.live ?? true) !== false,
    announcements: ann ?? 0,
  };
}
