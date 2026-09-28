import { createClient } from "@/lib/supabase/server";
import { programSlug } from "@/lib/submissions";
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

export type ActivityFilter = "all" | "submissions" | "agreements" | "evaluations" | "account";

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

export type ActivityEntry = {
  id: string;
  at: string;
  title: string;
  context: string | null;
  actor: string | null;
  icon: ActivityIcon;
  href: string | null;
};

export type ActivityCursor = { createdAt: string; id: string };
export type ActivityFeed = { entries: ActivityEntry[]; next: ActivityCursor | null };

const FILTER_TABLES: Record<Exclude<ActivityFilter, "all">, string[]> = {
  submissions: ["submissions", "submission_documents", "submission_choices"],
  agreements: ["ndas"],
  evaluations: ["visit_evaluations", "evaluations", "evaluation_items", "assignment_accreditors"],
  account: ["profiles", "accreditor_expertise"],
};

export function parseActivityFilter(value: string | undefined): ActivityFilter {
  return value && value in FILTER_TABLES ? (value as ActivityFilter) : "all";
}

// Most audit rows are bookkeeping (autosaves, updated_at bumps, join rows) that
// describe() drops, so one page of raw rows can yield only a handful of
// sentences. Batches are read until there is enough to show.
const BATCH = 100;
const WANT = 25;
const MAX_BATCHES = 5;
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

type Link = "files" | "submission" | "evaluations" | "documents" | "events" | "assignment";

type Described = {
  title: string;
  icon: ActivityIcon;
  upload?: string;
  ref: { submission?: string; phaseDocument?: string; area?: string; assignment?: string };
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
      if (changed("is_active")) return { title: `${n.is_active ? "Reactivated" : "Deactivated"} ${personOf(n)}`, icon: "account", ref: {} };
      if (changed("role")) return { title: `Changed the role of ${personOf(n)}`, icon: "account", ref: {} };
      if (["surname", "given_name", "middle_initial", "position_id", "campus_id", "college_id"].some(changed))
        return { title: self ? "Updated your profile" : `Updated the profile of ${personOf(n)}`, icon: "account", ref: {} };
      return null;
    }
    case "accreditor_expertise":
      return { title: `Updated ${your} discipline expertise`, icon: "account", ref: {} };
    case "ndas":
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
    case "templates":
    case "common_documents":
    case "repository_files": {
      const title = str(row.title) ?? "a file";
      if (op === "insert") return { title: `Uploaded ${title} to Documents`, icon: "document", ref: {}, link: "documents" };
      if (op === "delete") return { title: `Removed ${title} from Documents`, icon: "remove", ref: {}, link: "documents" };
      if (became("is_archived", true)) return { title: `Archived ${title}`, icon: "document", ref: {}, link: "documents" };
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

export async function getActivityFeed(
  filter: ActivityFilter,
  role: PortalRole,
  cursor?: ActivityCursor,
): Promise<ActivityFeed> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewer = user?.id ?? null;

  const found: { raw: RawRow; d: Described }[] = [];
  let next: ActivityCursor | null = cursor ?? null;

  for (let batch = 0; batch < MAX_BATCHES && found.length < WANT; batch++) {
    let query = supabase
      .from("activity_logs")
      .select(
        "id, action_type, target_table, target_id, old_value, new_value, created_at, actor_id, actor:actor_id (surname, given_name)",
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(BATCH);
    if (filter !== "all") query = query.in("target_table", FILTER_TABLES[filter]);
    if (next) {
      query = query.or(
        `created_at.lt.${next.createdAt},and(created_at.eq.${next.createdAt},id.lt.${next.id})`,
      );
    }

    const { data } = await query;
    const rows = (data ?? []) as RawRow[];
    for (const raw of rows) {
      const d = describe(raw, viewer);
      if (d) found.push({ raw, d });
    }
    const last = rows[rows.length - 1];
    next = rows.length === BATCH && last ? { createdAt: last.created_at, id: last.id } : null;
    if (!next) break;
  }

  const ids = (pick: (d: Described) => string | undefined) => [
    ...new Set(found.map((f) => pick(f.d)).filter((v): v is string => Boolean(v))),
  ];

  const assignmentIds = ids((d) => d.ref.assignment);
  const { data: assignments } = assignmentIds.length
    ? await supabase.from("assignments").select("id, submission_id").in("id", assignmentIds)
    : { data: [] };
  const submissionOfAssignment = new Map((assignments ?? []).map((a) => [a.id, a.submission_id]));

  const submissionIds = [
    ...new Set([...ids((d) => d.ref.submission), ...(assignments ?? []).map((a) => a.submission_id)]),
  ];
  const phaseDocIds = ids((d) => d.ref.phaseDocument);
  const areaIds = ids((d) => d.ref.area);

  const [{ data: submissions }, { data: phaseDocs }, { data: areas }] = await Promise.all([
    submissionIds.length
      ? supabase
          .from("submissions")
          .select("id, program_id, level_id, programs(name), accreditation_levels(name)")
          .in("id", submissionIds)
      : Promise.resolve({ data: [] }),
    phaseDocIds.length
      ? supabase.from("phase_documents").select("id, phase_id, phases(ordinal, name)").in("id", phaseDocIds)
      : Promise.resolve({ data: [] }),
    areaIds.length
      ? supabase.from("requirement_areas").select("id, name").in("id", areaIds)
      : Promise.resolve({ data: [] }),
  ]);

  const subById = new Map((submissions ?? []).map((s) => [s.id, s]));
  const phaseById = new Map((phaseDocs ?? []).map((p) => [p.id, p]));
  const areaById = new Map((areas ?? []).map((a) => [a.id, a]));

  const entries: (ActivityEntry & { groupKey: string | null; names: string[]; actorId: string | null })[] = [];

  for (const { raw, d } of found) {
    const subId = d.ref.submission ?? (d.ref.assignment ? submissionOfAssignment.get(d.ref.assignment) : undefined);
    const sub = subId ? subById.get(subId) : undefined;
    const phaseDoc = d.ref.phaseDocument ? phaseById.get(d.ref.phaseDocument) : undefined;
    const area = d.ref.area ? areaById.get(d.ref.area) : undefined;
    const level = sub?.accreditation_levels?.name;
    const program = sub?.programs?.name;
    const phaseLabel = phaseDoc?.phases ? `Phase ${phaseDoc.phases.ordinal} (${phaseDoc.phases.name})` : undefined;

    const context =
      [level, phaseLabel ?? area?.name ?? (level ? undefined : program)].filter(Boolean).join(" · ") ||
      d.extra ||
      null;

    const slug = sub && program ? programSlug(sub.program_id, program) : null;
    const base = slug && sub ? `/portal/submission?program=${slug}&level=${sub.level_id}` : null;
    let href: string | null = null;
    if (d.link === "documents") href = "/portal/documents";
    else if (d.link === "events") href = "/portal/events";
    else if (role === "program_representative") {
      if (d.link === "evaluations") href = "/portal/submission/evaluation";
      else if (d.link === "files" && base && phaseDoc?.phases)
        href = `${base}&view=phases&phase=${phaseDoc.phases.ordinal}&modal=files`;
      else if (d.link === "files" && base && area) href = `${base}&view=requirements&area=${area.id}&modal=files`;
      else if ((d.link === "submission" || d.link === "files") && base) href = `${base}&view=phases`;
    } else if (d.link === "assignment" && d.ref.assignment) {
      href =
        role === "internal_accreditor"
          ? `/portal/evaluation/${d.ref.assignment}`
          : `/portal/assignment/${d.ref.assignment}`;
    }

    const groupKey = d.upload && subId ? `${raw.actor_id}:${subId}:${phaseDoc?.phase_id ?? area?.id ?? ""}` : null;
    const prev = entries[entries.length - 1];
    if (
      groupKey &&
      prev?.groupKey === groupKey &&
      new Date(prev.at).getTime() - new Date(raw.created_at).getTime() < GROUP_WINDOW_MS
    ) {
      prev.names.unshift(d.upload!);
      prev.title = `Uploaded ${joinNames(prev.names)}`;
      continue;
    }
    if (
      !groupKey &&
      prev &&
      prev.title === d.title &&
      prev.actorId === raw.actor_id &&
      new Date(prev.at).getTime() - new Date(raw.created_at).getTime() < GROUP_WINDOW_MS
    ) {
      continue;
    }

    entries.push({
      id: raw.id,
      at: raw.created_at,
      title: d.title,
      context,
      actor: raw.actor_id === viewer ? null : raw.actor ? `${raw.actor.surname}, ${raw.actor.given_name}` : "System",
      icon: d.icon,
      href,
      groupKey,
      names: d.upload ? [d.upload] : [],
      actorId: raw.actor_id,
    });
  }

  return {
    entries: entries.map(({ id, at, title, context, actor, icon, href }) => ({
      id,
      at,
      title,
      context,
      actor,
      icon,
      href,
    })),
    next,
  };
}
