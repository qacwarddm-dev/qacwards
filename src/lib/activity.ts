import { createClient } from "@/lib/supabase/server";

import type { PortalRole } from "@/components/portal/portal-nav";

/**
 * Reads behind `/portal/activity`.
 *
 * Scope is decision 17 — own actions only, QAC Admin sees all — and it is
 * enforced by two RLS policies, not here. This file passes no actor filter at
 * all, so what comes back is whatever the caller is allowed to see.
 *
 * Keyset-paginated on `(created_at desc, id desc)` per §8.3: `activity_logs` is
 * the one table in this schema that grows without bound, which is exactly where
 * OFFSET degrades.
 */

export type ActivityIcon =
  | "upload"
  | "start"
  | "submit"
  | "remove"
  | "agreement"
  | "photo"
  | "signature"
  | "evaluation"
  | "decision"
  | "assignment"
  | "event"
  | "document"
  | "account";

export type ActivityCursor = { createdAt: string; id: string };

// Most audit rows are bookkeeping (autosaves, updated_at bumps, join rows) that
// describe() drops, so one page of raw rows can yield only a handful of
// sentences. Batches are read until there is enough to show.
const BATCH = 100;
const GROUP_WINDOW_MS = 15 * 60 * 1000;

type Json = Record<string, unknown>;

type RawRow = {
  id: string;
  action_type: string;
  target_table: string;
  target_id: string | null;
  old_value: unknown;
  new_value: unknown;
  created_at: string;
  actor_id: string | null;
  actor: { surname: string; given_name: string } | null;
};

type Link = "files" | "submission" | "evaluations" | "documents" | "events" | "assignment" | "aaccup-copc";

export type ActivityCat = "sub" | "rev" | "asg" | "file" | "rep" | "ev" | "agr" | "set" | "acct" | "eval" | "sys";

type Described = {
  title: string;
  icon: ActivityIcon;
  cat?: ActivityCat;
  upload?: string;
  ref: { submission?: string; phaseDocument?: string; area?: string; assignment?: string; document?: string };
  link?: Link;
  extra?: string;
};

const str = (v: unknown) => (typeof v === "string" && v.length > 0 ? v : undefined);

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
}

function personOf(row: Json) {
  const s = str(row.surname);
  const g = str(row.given_name);
  return s && g ? `${s}, ${g}` : "a user";
}

function describe(r: RawRow, viewer: string | null): Described | null {
  const n = (r.new_value ?? {}) as Json;
  const o = (r.old_value ?? {}) as Json;
  const row = r.action_type === "delete" ? o : n;
  const op = r.action_type;
  const changed = (k: string) => op === "update" && JSON.stringify(o[k]) !== JSON.stringify(n[k]);
  const became = (k: string, v: unknown) => changed(k) && n[k] === v;
  const your = r.actor_id === viewer ? "your" : "their";

  switch (r.target_table) {
    case "submission_documents": {
      const title = str(row.title) ?? "a document";
      const ref = {
        submission: str(row.submission_id),
        phaseDocument: str(row.phase_document_id),
        area: str(row.requirement_area_id),
      };
      if (op === "insert" && row.supersedes_id) return { title: `Replaced ${title}`, icon: "upload", ref, link: "files" };
      if (op === "insert") return { title: `Uploaded ${title}`, icon: "upload", upload: title, ref, link: "files" };
      if (op === "delete") return { title: `Removed ${title}`, icon: "remove", ref, link: "files" };
      return null;
    }
    case "submissions": {
      const ref = { submission: str(row.id) };
      if (op === "insert") return { title: "Started a submission", icon: "start", ref, link: "submission" };
      if (op === "delete") return { title: "Deleted a submission", icon: "remove", ref };
      if (became("status", "submitted")) return { title: "Submitted documents for review", icon: "submit", ref, link: "submission" };
      if (became("status", "under_evaluation"))
        return {
          title: o.status === "returned" ? "Resubmitted documents" : "Sent documents for evaluation",
          icon: "submit",
          ref,
          link: "submission",
        };
      if (became("status", "returned")) return { title: "Returned a submission for revision", icon: "remove", ref, link: "submission" };
      return null;
    }
    case "submission_choices": {
      const ref = { submission: str(row.submission_id), area: str(row.requirement_area_id) };
      if (op === "insert") return { title: "Chose an optional area", icon: "start", ref };
      if (op === "delete") return { title: "Dropped an optional area", icon: "remove", ref };
      return null;
    }
    case "profiles": {
      const self = r.actor_id === viewer && r.target_id === viewer;
      if (op === "insert") return { title: self ? "Your account was created" : `Created an account for ${personOf(n)}`, icon: "account", ref: {} };
      const photo = (k: string, noun: string, article: string, icon: ActivityIcon): Described | null => {
        if (!changed(k)) return null;
        const whose = self ? "your" : r.actor_id === r.target_id ? your : `${personOf(n)}'s`;
        const title = !o[k] ? `Added ${whose === "your" ? article : whose} ${noun}` : !n[k] ? `Removed ${whose} ${noun}` : `Changed ${whose} ${noun}`;
        return { title, icon, ref: {} };
      };
      const media =
        photo("avatar_path", "profile photo", "a", "photo") ??
        photo("signature_path", "e-signature", "an", "signature");
      if (media) return media;
      if (changed("deleted_at")) return { title: `${n.deleted_at ? "Deleted" : "Restored"} ${personOf(n)}`, icon: "account", ref: {} };
      if (changed("is_active")) return { title: `${n.is_active ? "Reactivated" : "Deactivated"} ${personOf(n)}`, icon: "account", ref: {} };
      if (changed("role")) return { title: `Changed the role of ${personOf(n)}`, icon: "account", ref: {} };
      if (["surname", "given_name", "middle_initial", "position_id", "campus_id", "college_id"].some(changed))
        return { title: self ? "Updated your profile" : `Updated the profile of ${personOf(n)}`, icon: "account", ref: {} };
      return null;
    }
    case "accreditor_expertise":
      return { title: `Updated ${your} discipline expertise`, icon: "account", ref: {} };
    case "ndas":
      if (became("status", "verified")) return { title: "Verified an NDA", icon: "agreement", cat: "agr", ref: {}, link: "documents", extra: str(n.file_id) ? `NDA File ID ${n.file_id}` : undefined };
      if (became("status", "returned")) return { title: "Returned an NDA", icon: "agreement", cat: "agr", ref: {}, link: "documents", extra: str(n.review_note) };
      if (op === "insert") return { title: "Signed the Non-Disclosure Agreement", icon: "agreement", ref: {}, link: "documents" };
      if (changed("file_id") || changed("storage_path"))
        return { title: "Uploaded a new signed Non-Disclosure Agreement", icon: "agreement", ref: {}, link: "documents" };
      return null;
    case "assignment_accreditors": {
      const ref = { assignment: str(row.assignment_id) };
      if (op === "insert") return { title: "Assigned an internal accreditor", icon: "assignment", ref, link: "assignment" };
      if (op === "delete") return { title: "Removed an internal accreditor", icon: "assignment", ref, link: "assignment" };
      if (became("response", "accepted")) return { title: "Accepted an assignment", icon: "assignment", ref, link: "assignment" };
      if (became("response", "rejected")) return { title: "Declined an assignment", icon: "assignment", ref, link: "assignment" };
      return null;
    }
    case "assignments": {
      const ref = { assignment: str(row.id) };
      if (op === "insert") return { title: "Created an assignment", icon: "assignment", ref, link: "assignment" };
      if (became("status", "for_psv")) return { title: "Marked a program ready for the survey visit", icon: "assignment", ref, link: "assignment" };
      if (changed("site_visit_date") && str(n.site_visit_date))
        return { title: `Set the site visit for ${shortDate(`${n.site_visit_date}T00:00:00+08:00`)}`, icon: "event", ref, link: "assignment" };
      if (changed("due_date")) return { title: "Changed an assignment's due date", icon: "assignment", ref, link: "assignment" };
      return null;
    }
    case "evaluations": {
      const ref = { assignment: str(row.assignment_id) };
      if (changed("evaluated_at") && n.evaluated_at) return { title: "Submitted the evaluation sheet", icon: "evaluation", ref, link: "assignment" };
      if (changed("released_at") && n.released_at) return { title: "Released the evaluation result", icon: "decision", ref, link: "assignment" };
      if (changed("outcome") && n.outcome)
        return { title: `Recorded a ${n.outcome === "passed" ? "passing" : "failing"} result`, icon: "decision", ref, link: "assignment" };
      return null;
    }
    case "evaluation_items": {
      const label = str(row.label) ?? "a document";
      if (became("decision", "approved")) return { title: `Approved ${label}`, icon: "decision", ref: {} };
      if (became("decision", "disapproved")) return { title: `Disapproved ${label}`, icon: "remove", ref: {} };
      return null;
    }
    case "visit_evaluations": {
      if (!n.submitted_at || o.submitted_at) return null;
      return {
        title: n.kind === "qac_service" ? "Answered the QAC Service Evaluation" : "Answered an Internal Accreditor Evaluation",
        icon: "evaluation",
        ref: { assignment: str(n.assignment_id) },
        link: "evaluations",
      };
    }
    case "events": {
      const title = str(row.title) ?? "an event";
      const extra = str(row.start_time) ? shortDate(row.start_time as string) : undefined;
      if (op === "insert") return { title: `Scheduled ${title}`, icon: "event", ref: {}, link: "events", extra };
      if (op === "delete") return { title: `Deleted ${title}`, icon: "event", ref: {}, link: "events" };
      if (changed("cancelled_at") && n.cancelled_at) return { title: `Cancelled ${title}`, icon: "event", ref: {}, link: "events", extra };
      if (["title", "start_time", "end_time", "description"].some(changed))
        return { title: `Updated ${title}`, icon: "event", ref: {}, link: "events", extra };
      return null;
    }
    case "repository_files": {
      const title = str(row.title) ?? "a file";
      if (op === "insert") return { title: `Uploaded ${title} to AACCUP & COPC`, icon: "document", ref: {}, link: "aaccup-copc" };
      if (became("is_archived", true)) return { title: `Deleted ${title} from AACCUP & COPC`, icon: "remove", ref: {}, link: "aaccup-copc" };
      if (became("is_archived", false)) return { title: `Restored ${title} to AACCUP & COPC`, icon: "document", ref: {}, link: "aaccup-copc" };
      if (changed("title")) return { title: `Renamed ${str(o.title) ?? "a file"} to ${title}`, icon: "document", ref: {}, link: "aaccup-copc" };
      return null;
    }
    case "templates":
    case "common_documents": {
      const title = str(row.title) ?? "a file";
      if (op === "insert") return { title: `Uploaded ${title} to Documents`, icon: "document", ref: {}, link: "documents" };
      if (op === "delete") return { title: `Removed ${title} from Documents`, icon: "remove", ref: {}, link: "documents" };
      if (became("is_archived", true)) return { title: `Archived ${title}`, icon: "document", ref: {}, link: "documents" };
      if (changed("deleted_at")) return n.deleted_at ? { title: `Removed ${title} from Documents`, icon: "remove", ref: {}, link: "documents" } : { title: `Restored ${title} to Documents`, icon: "document", ref: {}, link: "documents" };
      return null;
    }
    case "program_reps":
      if (op === "insert") return { title: "Assigned a program representative", icon: "account", ref: {} };
      if (op === "delete") return { title: "Removed a program representative", icon: "account", ref: {} };
      return null;
    case "accreditation_cycles": {
      const name = str(row.name) ?? "an accreditation";
      if (op === "insert") return { title: `Created the ${name} cycle`, icon: "event", ref: {} };
      if (became("status", "open")) return { title: `Opened the ${name} cycle`, icon: "event", ref: {} };
      if (became("status", "closed")) return { title: `Closed the ${name} cycle`, icon: "event", ref: {} };
      return null;
    }
    case "program_accreditations":
      return op === "insert" ? { title: "Recorded an accreditation award", icon: "decision", ref: {} } : null;
    case "extension_requests": {
      const ref = { assignment: str(row.assignment_id) };
      if (op === "insert") return { title: "Requested a deadline extension", icon: "assignment", ref, link: "assignment" };
      if (became("status", "approved")) return { title: "Approved a deadline extension", icon: "decision", ref, link: "assignment" };
      if (became("status", "declined")) return { title: "Declined a deadline extension", icon: "remove", ref, link: "assignment" };
      return null;
    }
    case "document_reviews": {
      const ref = { document: str(row.submission_document_id) };
      if (op !== "insert") return null;
      if (n.decision === "approved") return { title: "Approved {doc}", icon: "decision", cat: "rev", ref, link: "files" };
      if (n.decision === "returned") return { title: "Returned {doc} for revision", icon: "remove", cat: "rev", ref, link: "files", extra: str(n.note) ? `“${n.note}”` : undefined };
      if (n.decision === "undone") return { title: "Undid the decision on {doc}", icon: "decision", cat: "rev", ref, link: "files" };
      return null;
    }
    case "accreditor_reports": {
      const ref = { assignment: str(row.assignment_id) };
      if (became("status", "submitted")) return { title: "Signed and submitted the evaluation report", icon: "evaluation", cat: "rev", ref, link: "assignment", extra: str(n.doc_code) };
      if (became("status", "acknowledged")) return { title: "Acknowledged an evaluation report", icon: "decision", cat: "rev", ref, link: "assignment", extra: str(n.doc_code) };
      if (became("status", "returned")) return { title: "Returned an evaluation report", icon: "remove", cat: "rev", ref, link: "assignment" };
      return null;
    }
    case "account_events": {
      const t: Record<string, string> = {
        password_changed: "Changed the account password",
        contact_updated: "Updated the contact details",
        notif_prefs_updated: "Updated notification preferences",
        signed_in: "Signed in from a new device",
      };
      return t[op] ? { title: t[op], icon: "account", cat: "acct", ref: {} } : null;
    }
    case "saved_reports":
      return op === "insert" ? { title: `Generated the ${str(row.title) ?? "report"}`, icon: "document", cat: "rep", ref: {}, extra: str(row.scope) } : op === "delete" ? { title: `Deleted the ${str(row.title) ?? "report"}`, icon: "remove", cat: "rep", ref: {} } : null;
    case "announcements":
      if (op === "insert") return { title: `Posted the announcement “${str(row.title) ?? ""}”`, icon: "event", cat: "set", ref: {} };
      if (became("is_published", true)) return { title: `Published “${str(row.title) ?? ""}”`, icon: "event", cat: "set", ref: {} };
      return null;
    case "site_settings":
      return { title: `Updated ${String(str(row.key) ?? "system").replace(/_/g, " ")} settings`, icon: "account", cat: "set", ref: {} };
    case "system_backups":
      if (op !== "insert") return null;
      return n.kind === "automatic"
        ? { title: n.status === "ok" ? "Automatic backup finished" : "Automatic backup failed", icon: "document", cat: "sys", ref: {} }
        : { title: "Created a manual backup", icon: "document", cat: "set", ref: {}, extra: str(n.note) };
    case "repository_units":
      return op === "insert" ? { title: `Created the folder ${str(row.name) ?? ""}`, icon: "document", cat: "file", ref: {} } : null;
    case "template_versions":
      return op === "insert" ? { title: `Uploaded v${String(row.version ?? "")} of a template`, icon: "document", cat: "file", ref: {} } : null;
    default:
      return null;
  }
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  if (names.length === 3) return `${names[0]}, ${names[1]} and ${names[2]}`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} more`;
}

// ------------------------------------------------------- mockup activity

const CAT_BY_TABLE: Record<string, ActivityCat> = {
  submissions: "sub",
  submission_documents: "sub",
  submission_choices: "sub",
  ndas: "agr",
  visit_evaluations: "eval",
  evaluations: "rev",
  evaluation_items: "rev",
  document_reviews: "rev",
  accreditor_reports: "rev",
  assignment_accreditors: "asg",
  assignments: "asg",
  profiles: "acct",
  accreditor_expertise: "acct",
  account_events: "acct",
  events: "ev",
  templates: "file",
  template_versions: "file",
  common_documents: "file",
  repository_files: "file",
  repository_units: "file",
  saved_reports: "rep",
  program_reps: "set",
  accreditation_cycles: "set",
  program_accreditations: "rev",
  extension_requests: "asg",
  site_settings: "set",
  announcements: "set",
  system_backups: "set",
};

export type MyActivityEntry = {
  id: string;
  at: string;
  title: string;
  context: string | null;
  href: string | null;
  cat: ActivityCat;
  actor: string;
  actorId: string | null;
  actorRole: PortalRole | "system";
  test: boolean;
  ip: string | null;
};

export async function getActivityEntries(opts: {
  actorId?: string;
  role: PortalRole;
  want?: number;
  maxBatches?: number;
}): Promise<MyActivityEntry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewer = user?.id ?? null;
  const want = opts.want ?? 150;
  const found: { raw: RawRow & { actor_role?: string | null; ip?: string | null }; d: Described }[] = [];
  let cursor: ActivityCursor | null = null;
  for (let batch = 0; batch < (opts.maxBatches ?? 10) && found.length < want; batch++) {
    let q = supabase
      .from("activity_logs")
      .select("id, action_type, target_table, target_id, old_value, new_value, created_at, actor_id, ip_address, actor:actor_id (surname, given_name, role)")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(BATCH);
    if (opts.actorId) q = q.eq("actor_id", opts.actorId);
    if (cursor) q = q.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`);
    const { data } = await q;
    const rows = (data ?? []) as unknown as (RawRow & { ip_address: unknown; actor: { surname: string; given_name: string; role: string } | null })[];
    for (const raw of rows) {
      const d = describe(raw, viewer);
      if (d) found.push({ raw: { ...raw, actor_role: raw.actor?.role ?? null, ip: raw.ip_address ? String(raw.ip_address) : null }, d });
    }
    const last = rows[rows.length - 1];
    cursor = rows.length === BATCH && last ? { createdAt: last.created_at, id: last.id } : null;
    if (!cursor) break;
  }

  const ids = (pick: (d: Described) => string | undefined) => [...new Set(found.map((f) => pick(f.d)).filter((v): v is string => Boolean(v)))];
  const docIds = ids((d) => d.ref.document);
  const { data: docs } = docIds.length
    ? await supabase.from("submission_documents").select("id, title, submission_id, phase_document_id, requirement_area_id").in("id", docIds)
    : { data: [] };
  const docById = new Map((docs ?? []).map((x) => [x.id, x]));
  const assignmentIds = ids((d) => d.ref.assignment);
  const { data: assignments } = assignmentIds.length ? await supabase.from("assignments").select("id, submission_id").in("id", assignmentIds) : { data: [] };
  const subOfAsg = new Map((assignments ?? []).map((a) => [a.id, a.submission_id]));
  const submissionIds = [...new Set([...ids((d) => d.ref.submission), ...(assignments ?? []).map((a) => a.submission_id), ...(docs ?? []).map((x) => x.submission_id)])];
  const phaseDocIds = [...new Set([...ids((d) => d.ref.phaseDocument), ...(docs ?? []).map((x) => x.phase_document_id).filter((v): v is string => Boolean(v))])];
  const areaIds = [...new Set([...ids((d) => d.ref.area), ...(docs ?? []).map((x) => x.requirement_area_id).filter((v): v is string => Boolean(v))])];
  const [{ data: subs }, { data: phaseDocs }, { data: areas }] = await Promise.all([
    submissionIds.length ? supabase.from("submissions").select("id, program_id, level_id, programs(name), accreditation_levels(name)").in("id", submissionIds) : Promise.resolve({ data: [] }),
    phaseDocIds.length ? supabase.from("phase_documents").select("id, name, phase_id, phases(ordinal, name)").in("id", phaseDocIds) : Promise.resolve({ data: [] }),
    areaIds.length ? supabase.from("requirement_areas").select("id, name").in("id", areaIds) : Promise.resolve({ data: [] }),
  ]);
  const subById = new Map((subs ?? []).map((x) => [x.id, x]));
  const phaseById = new Map((phaseDocs ?? []).map((x) => [x.id, x]));
  const areaById = new Map((areas ?? []).map((x) => [x.id, x]));
  const { programShort } = await import("@/lib/program-names");

  const out: (MyActivityEntry & { groupKey: string | null; names: string[] })[] = [];
  for (const { raw, d } of found) {
    const doc = d.ref.document ? docById.get(d.ref.document) : undefined;
    const subId = d.ref.submission ?? doc?.submission_id ?? (d.ref.assignment ? subOfAsg.get(d.ref.assignment) : undefined);
    const sub = subId ? subById.get(subId) : undefined;
    const phaseDoc = phaseById.get(d.ref.phaseDocument ?? doc?.phase_document_id ?? "");
    const area = areaById.get(d.ref.area ?? doc?.requirement_area_id ?? "");
    const docName = phaseDoc?.name ?? area?.name ?? doc?.title ?? "a document";
    const title = d.title.replace("{doc}", docName);
    const program = sub?.programs?.name ? programShort(sub.programs.name) : undefined;
    const phaseLabel = phaseDoc?.phases ? `Phase ${phaseDoc.phases.ordinal} – ${phaseDoc.phases.name}` : undefined;
    const context = [program, sub?.accreditation_levels?.name, phaseLabel ?? (area && !d.ref.document ? area.name : undefined), d.extra].filter(Boolean).join(" · ") || null;

    let href: string | null = null;
    if (d.link === "documents") href = "/portal/documents";
    else if (d.link === "aaccup-copc") href = opts.role === "program_representative" ? "/portal/documents?tab=reports" : "/portal/aaccup-copc";
    else if (d.link === "events") href = "/portal/events";
    else if (opts.role === "program_representative" && sub) href = `/portal/submission?program=${sub.program_id}&level=${sub.level_id}`;
    else if (opts.role === "program_representative" && d.link === "evaluations") href = "/portal/feedback?tab=eval";
    else if (opts.role === "internal_accreditor" && d.ref.assignment) href = `/portal/evaluation?a=${d.ref.assignment}`;
    else if ((opts.role === "qac_personnel" || opts.role === "qac_admin") && sub) href = phaseDoc ? `/portal/extension-monitoring?sub=${sub.id}` : `/portal/assignment?sub=${sub.id}`;

    const cat = d.cat ?? CAT_BY_TABLE[raw.target_table] ?? "acct";
    const actor = raw.actor ? `${raw.actor.surname}, ${raw.actor.given_name}` : "Mailer, System";
    const groupKey = d.upload && subId ? `${raw.actor_id}:${subId}:${phaseDoc?.phase_id ?? area?.id ?? ""}` : null;
    const prev = out[out.length - 1];
    if (groupKey && prev?.groupKey === groupKey && new Date(prev.at).getTime() - new Date(raw.created_at).getTime() < GROUP_WINDOW_MS) {
      prev.names.unshift(d.upload!);
      prev.title = `Uploaded ${joinNames(prev.names)}`;
      continue;
    }
    const close = prev && prev.actorId === raw.actor_id && new Date(prev.at).getTime() - new Date(raw.created_at).getTime() < GROUP_WINDOW_MS;
    if (!groupKey && close && d.ref.document && title.startsWith("Approved ") && prev.title.startsWith("Approved ") && prev.context === context) {
      const m = prev.title.match(/^Approved (\d+) documents$/);
      prev.title = `Approved ${m ? Number(m[1]) + 1 : 2} documents`;
      continue;
    }
    if (!groupKey && close && prev.title === title) continue;
    out.push({
      id: raw.id,
      at: raw.created_at,
      title,
      context,
      href,
      cat,
      actor,
      actorId: raw.actor_id,
      actorRole: (raw.actor_role as PortalRole | null) ?? "system",
      test: /__T/.test(title),
      ip: raw.ip ?? null,
      groupKey,
      names: d.upload ? [d.upload] : [],
    });
  }
  return out.map(({ groupKey, names, ...e }) => e);
}
