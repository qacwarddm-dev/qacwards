import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

export const BACKUP_ROOT = path.resolve("data/progress-backups");
export const BUCKETS = ["submissions", "ndas"];
const PAGE = 1000;
const MIME = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

// Parents first: restore walks this top to bottom, reset walks it bottom to top.
export const TABLES = [
  { name: "nda_issuances", pk: "file_id" },
  { name: "ndas", pk: "profile_id" },
  { name: "submissions", pk: "id", keep: true },
  { name: "submission_choices", pk: "submission_id", conflict: "submission_id,requirement_area_id" },
  { name: "assignments", pk: "id" },
  { name: "assignment_accreditors", pk: "assignment_id", conflict: "assignment_id,profile_id" },
  { name: "extension_requests", pk: "id" },
  { name: "submission_documents", pk: "id", selfFk: "supersedes_id" },
  { name: "document_reviews", pk: "id" },
  { name: "submission_returns", pk: "id" },
  { name: "evaluations", pk: "id" },
  { name: "evaluation_items", pk: "id" },
  { name: "accreditor_reports", pk: "assignment_id", conflict: "assignment_id,accreditor_id" },
  { name: "area_ratings", pk: "assignment_id", conflict: "assignment_id,accreditor_id,requirement_area_id,indicator" },
  { name: "visit_evaluations", pk: "id" },
  { name: "program_accreditations", pk: "id", selfFk: "superseded_by" },
  { name: "notifications", pk: "id", noise: true },
  { name: "email_outbox", pk: "id", noise: true },
  { name: "activity_logs", pk: "id", noise: true },
];

export function connect() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing — run with `node --env-file=.env`");
  // A publishable/anon key is subject to RLS: every count reads 0 and the
  // "backup" would be empty while looking successful.
  const role = key.startsWith("sb_") ? (key.startsWith("sb_secret_") ? "service_role" : "anon") : jwtRole(key);
  if (role !== "service_role") throw new Error(`SUPABASE_SERVICE_ROLE_KEY is a ${role ?? "non-service"} key — put the service_role / sb_secret_ key in .env`);
  return { db: createClient(url, key, { auth: { persistSession: false } }), host: new URL(url).host };
}

function jwtRole(key) {
  try {
    return JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role;
  } catch {
    return null;
  }
}

export async function fetchAll(db, table) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from(table).select("*").range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

export async function listObjects(db, bucket, prefix = "") {
  const out = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await db.storage.from(bucket).list(prefix, { limit: 100, offset });
    if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`);
    for (const e of data) {
      const full = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.id === null) out.push(...(await listObjects(db, bucket, full)));
      else out.push(full);
    }
    if (data.length < 100) return out;
  }
}

export async function snapshot(db, label) {
  const dir = path.join(BACKUP_ROOT, `${new Date().toISOString().replace(/[:.]/g, "-")}_${label}`);
  await mkdir(path.join(dir, "tables"), { recursive: true });
  const counts = {};
  for (const t of TABLES) {
    const rows = await fetchAll(db, t.name);
    counts[t.name] = rows.length;
    await writeFile(path.join(dir, "tables", `${t.name}.json`), JSON.stringify(rows));
  }
  const files = {};
  for (const bucket of BUCKETS) {
    const paths = await listObjects(db, bucket);
    files[bucket] = paths.length;
    for (const p of paths) {
      const { data, error } = await db.storage.from(bucket).download(p);
      if (error) throw new Error(`download ${bucket}/${p}: ${error.message}`);
      const dest = path.join(dir, "files", bucket, p);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, Buffer.from(await data.arrayBuffer()));
    }
  }
  await writeFile(path.join(dir, "manifest.json"), JSON.stringify({ created_at: new Date().toISOString(), counts, files }, null, 2));
  return { dir, counts, files };
}

export async function wipe(db) {
  for (const bucket of BUCKETS) {
    const paths = await listObjects(db, bucket);
    for (let i = 0; i < paths.length; i += 100) {
      const { error } = await db.storage.from(bucket).remove(paths.slice(i, i + 100));
      if (error) throw new Error(`remove ${bucket}: ${error.message}`);
    }
  }
  for (const t of [...TABLES].reverse().filter((x) => !x.noise && !x.keep)) {
    await clearTable(db, t);
  }
  const { error } = await db
    .from("submissions")
    .update({ status: "not_started", submitted_at: null, website_url: null, updated_at: new Date().toISOString() })
    .not("id", "is", null);
  if (error) throw new Error(`reset submissions: ${error.message}`);
  await clearNoise(db);
}

// Run after everything else: every delete/update above fires notification and
// activity triggers that write fresh rows.
export async function clearNoise(db) {
  for (const t of [...TABLES].reverse().filter((x) => x.noise)) await clearTable(db, t);
}

async function clearTable(db, t) {
  const { error } = await db.from(t.name).delete().not(t.pk, "is", null);
  if (error) throw new Error(`delete ${t.name}: ${error.message}`);
}

export async function currentCounts(db) {
  const counts = {};
  for (const t of TABLES) {
    const { count, error } = await db.from(t.name).select("*", { count: "exact", head: true });
    if (error) throw new Error(`${t.name}: ${error.message}`);
    counts[t.name] = count;
  }
  const files = {};
  for (const bucket of BUCKETS) files[bucket] = (await listObjects(db, bucket)).length;
  return { counts, files };
}

export async function latestBackup() {
  const names = (await readdir(BACKUP_ROOT).catch(() => [])).sort();
  for (const n of names.reverse()) {
    if ((await stat(path.join(BACKUP_ROOT, n, "manifest.json")).catch(() => null))) return path.join(BACKUP_ROOT, n);
  }
  return null;
}

export async function restore(db, dir) {
  for (const t of TABLES) {
    const all = JSON.parse(await readFile(path.join(dir, "tables", `${t.name}.json`), "utf8"));
    // Pending mail from before the snapshot would be sent for real on restore.
    const rows = t.name === "email_outbox" ? all.filter((r) => r.status !== "pending") : all;
    if (t.noise) await clearTable(db, t);
    if (!rows.length) continue;
    const links = t.selfFk ? rows.filter((r) => r[t.selfFk]).map((r) => ({ id: r.id, v: r[t.selfFk] })) : [];
    const body = t.selfFk ? rows.map((r) => ({ ...r, [t.selfFk]: null })) : rows;
    for (let i = 0; i < body.length; i += 500) {
      const { error } = await db.from(t.name).upsert(body.slice(i, i + 500), { onConflict: t.conflict ?? t.pk });
      if (error) throw new Error(`restore ${t.name}: ${error.message}`);
    }
    for (const l of links) {
      const { error } = await db.from(t.name).update({ [t.selfFk]: l.v }).eq("id", l.id);
      if (error) throw new Error(`restore ${t.name} link: ${error.message}`);
    }
  }
  for (const bucket of BUCKETS) {
    const root = path.join(dir, "files", bucket);
    for (const rel of await walk(root)) {
      const body = await readFile(path.join(root, rel));
      const { error } = await db.storage.from(bucket).upload(rel.split(path.sep).join("/"), body, { upsert: true, contentType: MIME[path.extname(rel).toLowerCase()] ?? "application/octet-stream" });
      if (error) throw new Error(`upload ${bucket}/${rel}: ${error.message}`);
    }
  }
}

async function walk(dir, rel = "") {
  const out = [];
  for (const e of await readdir(path.join(dir, rel), { withFileTypes: true }).catch(() => [])) {
    const r = path.join(rel, e.name);
    if (e.isDirectory()) out.push(...(await walk(dir, r)));
    else out.push(r);
  }
  return out;
}

export async function countdown(seconds, what) {
  for (let s = seconds; s > 0; s--) {
    process.stdout.write(`\r${what} in ${s}s — Ctrl-C to abort `);
    await new Promise((r) => setTimeout(r, 1000));
  }
  process.stdout.write("\n");
}
