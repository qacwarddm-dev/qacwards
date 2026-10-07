import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC = join(ROOT, "src");
const SKIP_FILES = new Set(["database.types.ts"]);
const LIST_ONLY = process.argv.includes("--list");

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(name) && !SKIP_FILES.has(name)) yield full;
  }
}

function literalArg(text, openParen) {
  let i = openParen + 1;
  while (/\s/.test(text[i])) i++;
  const quote = text[i];
  if (quote === ")") return { kind: "empty" };
  if (quote !== '"' && quote !== "'" && quote !== "`") return { kind: "dynamic" };
  let out = "";
  for (let j = i + 1; j < text.length && text[j] !== quote; j++) {
    if (text[j] === "\\") {
      out += text[++j];
      continue;
    }
    if (quote === "`" && text[j] === "$" && text[j + 1] === "{") return { kind: "dynamic" };
    out += text[j];
  }
  return { kind: "literal", value: out.replace(/\s+/g, " ").trim() };
}

function collect() {
  const probes = new Map();
  let dynamic = 0;
  for (const file of walk(SRC)) {
    const text = readFileSync(file, "utf8");
    const rel = relative(ROOT, file);
    for (const m of text.matchAll(/\.from\(\s*(["'])([a-z_][a-z0-9_]*)\1\s*\)/g)) {
      if (/storage\s*$/.test(text.slice(Math.max(0, m.index - 20), m.index))) continue;
      const table = m[2];
      const start = m.index + m[0].length;
      const stop = Math.min(
        ...[text.indexOf(";", start), text.indexOf(".from(", start), text.length].filter((n) => n >= 0),
      );
      const line = text.slice(0, m.index).split("\n").length;
      const add = (select) => {
        const key = `${table}?${select}`;
        if (!probes.has(key)) probes.set(key, { table, select, where: [] });
        probes.get(key).where.push(`${rel}:${line}`);
      };
      add("*");
      const sel = text.slice(start, stop).match(/\.select\(/);
      if (!sel) continue;
      const arg = literalArg(text, start + sel.index + sel[0].length - 1);
      if (arg.kind === "dynamic") dynamic++;
      else if (arg.kind === "literal" && arg.value && arg.value !== "*") add(arg.value);
    }
  }
  return { probes: [...probes.values()], dynamic };
}

async function probe(base, key, { table, select }) {
  const url = `${base}/rest/v1/${table}?select=${encodeURIComponent(select)}&limit=0`;
  const res = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (res.ok) return null;
  const body = await res.json().catch(() => ({}));
  return `${body.code ?? res.status} ${body.message ?? ""}`.trim();
}

const { probes, dynamic } = collect();
console.log(`${probes.length} distinct table/select pairs found in src (${dynamic} selects skipped: built at runtime)`);

if (LIST_ONLY) {
  for (const p of probes) console.log(`${p.table}  select=${p.select}`);
  process.exit(0);
}

const base = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!base || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY to a local Supabase instance.");
  process.exit(2);
}
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(base)) {
  console.error(`Refusing to probe ${base}: only a local Supabase instance is allowed.`);
  process.exit(2);
}

const failures = [];
for (let i = 0; i < probes.length; i += 10) {
  await Promise.all(
    probes.slice(i, i + 10).map(async (p) => {
      const error = await probe(base, key, p);
      if (error) failures.push({ ...p, error });
    }),
  );
}

if (failures.length) {
  console.error(`\n${failures.length} query(ies) the database rejects:\n`);
  for (const f of failures) {
    console.error(`  ${f.where[0]}${f.where.length > 1 ? ` (+${f.where.length - 1} more)` : ""}`);
    console.error(`    from("${f.table}").select(${JSON.stringify(f.select)})`);
    console.error(`    ${f.error}\n`);
  }
  process.exit(1);
}
console.log("All selects are valid against the migrated schema.");
