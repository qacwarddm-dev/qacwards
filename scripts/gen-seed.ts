/**
 * Generates `supabase/seed.sql` from `src/lib/reference/*.ts`.
 *
 * The reference lists are authored in TypeScript because that is where a human
 * can read and edit them, but straight constants would leave an uploaded file's
 * requirement reference as a string with no foreign key, and readiness % would
 * have to be aggregated in application code once per programme per request. So
 * the TS stays the single edit point and this script projects it into real rows
 * (plans/BACKEND.md §2.1).
 *
 *     pnpm gen:seed      write supabase/seed.sql
 *     pnpm check:seed    fail if the committed seed.sql is stale (CI)
 *
 * The output is deterministic — same input, byte-identical file — which is what
 * makes the staleness check meaningful.
 *
 * Rows are inserted by natural key (slug / code / ordinal) and every statement is
 * an upsert, so `supabase db reset` and a re-run against a live database both land
 * the same data without duplicating it.
 */
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CAMPUSES,
  COLLEGES,
  EXPERTISE_AREAS,
  LEVELS,
  PHASES,
  PHASE_DOCUMENTS,
  POSITIONS,
  PROGRAMS,
  REPOSITORY_FOLDERS,
  REQUIREMENT_AREAS,
} from "../src/lib/reference/index";

const SEED_PATH = join(__dirname, "..", "..", "supabase", "seed.sql");

/** Single-quote escaping. Every value below is institutional text, but "Master's"
 *  alone is enough to corrupt the file without this. */
function q(value: string | number | boolean | null): string {
  if (value === null) return "null";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return `'${value.replace(/'/g, "''")}'`;
}

function section(title: string): string {
  return `\n-- ${"-".repeat(72 - title.length)} ${title}\n`;
}

function build(): string {
  const out: string[] = [];

  out.push(`-- GENERATED FILE — DO NOT EDIT.
--
-- Written by \`pnpm gen:seed\` from src/lib/reference/*.ts. Edit those, not this.
-- \`pnpm check:seed\` fails when this file drifts from them.
--
-- Loaded by \`supabase db reset\`. Every statement is an upsert on a natural key,
-- so re-running is safe and ids stay stable across resets.

begin;
`);

  out.push(section("campuses"));
  for (const c of CAMPUSES) {
    out.push(
      `insert into public.campuses (slug, name, is_main) values (${q(c.slug)}, ${q(c.name)}, ${q(c.isMain)})\n` +
        `  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;`,
    );
  }

  out.push(section("colleges"));
  for (const c of COLLEGES) {
    out.push(
      `insert into public.colleges (code, name) values (${q(c.code)}, ${q(c.name)})\n` +
        `  on conflict (code) do update set name = excluded.name;`,
    );
  }

  out.push(section("programs"));
  for (const p of PROGRAMS) {
    const college = p.college
      ? `(select id from public.colleges where code = ${q(p.college)})`
      : "null";
    out.push(
      `insert into public.programs (campus_id, college_id, name) values (\n` +
        `  (select id from public.campuses where slug = ${q(p.campus)}), ${college}, ${q(p.name)})\n` +
        `  on conflict (campus_id, name) do update set college_id = excluded.college_id;`,
    );
  }

  out.push(section("positions"));
  for (const p of POSITIONS) {
    out.push(
      `insert into public.positions (name, scope) values (${q(p.name)}, ${q(p.scope)})\n` +
        `  on conflict (name) do update set scope = excluded.scope;`,
    );
  }

  out.push(section("expertise areas"));
  for (const name of EXPERTISE_AREAS) {
    out.push(
      `insert into public.expertise_areas (name) values (${q(name)})\n` +
        `  on conflict (name) do nothing;`,
    );
  }

  out.push(section("accreditation levels"));
  for (const l of LEVELS) {
    out.push(
      `insert into public.accreditation_levels (code, name, ordinal, validity_years, required_choices)\n` +
        `  values (${q(l.code)}, ${q(l.name)}, ${q(l.ordinal)}, ${q(l.validityYears)}, ${q(l.requiredChoices)})\n` +
        `  on conflict (code) do update set name = excluded.name, ordinal = excluded.ordinal,\n` +
        `    validity_years = excluded.validity_years, required_choices = excluded.required_choices;`,
    );
  }

  out.push(section("phases"));
  for (const p of PHASES) {
    out.push(
      `insert into public.phases (ordinal, name) values (${q(p.ordinal)}, ${q(p.name)})\n` +
        `  on conflict (ordinal) do update set name = excluded.name;`,
    );
  }

  out.push(section("phase documents"));
  for (const d of PHASE_DOCUMENTS) {
    out.push(
      `insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (\n` +
        `  (select id from public.phases where ordinal = ${q(d.phase)}), ${q(d.ordinal)}, ${q(d.name)}, ${q(d.isOptional)})\n` +
        `  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;`,
    );
  }

  out.push(section("requirement areas"));
  for (const a of REQUIREMENT_AREAS) {
    out.push(
      `insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (\n` +
        `  (select id from public.accreditation_levels where code = ${q(a.level)}), ${q(a.ordinal)}, ${q(a.name)}, ${q(a.isOptional)})\n` +
        `  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;`,
    );
  }

  out.push(section("repository folders"));
  for (const f of REPOSITORY_FOLDERS) {
    out.push(
      `insert into public.repository_folders (slug, name, ordinal) values (${q(f.slug)}, ${q(f.name)}, ${q(f.ordinal)})\n` +
        `  on conflict (slug) do update set name = excluded.name, ordinal = excluded.ordinal;`,
    );
  }

  out.push("\ncommit;\n");
  return out.join("\n");
}

const sql = build();
const checkOnly = process.argv.includes("--check");

if (checkOnly) {
  let current = "";
  try {
    current = readFileSync(SEED_PATH, "utf8");
  } catch {
    console.error("supabase/seed.sql is missing. Run `pnpm gen:seed`.");
    process.exit(1);
  }
  if (current !== sql) {
    console.error(
      "supabase/seed.sql is stale — it does not match src/lib/reference/*.ts.\n" +
        "Run `pnpm gen:seed` and commit the result.",
    );
    process.exit(1);
  }
  console.log("supabase/seed.sql is up to date.");
} else {
  writeFileSync(SEED_PATH, sql);
  const counts = {
    campuses: CAMPUSES.length,
    colleges: COLLEGES.length,
    programs: PROGRAMS.length,
    positions: POSITIONS.length,
    expertise_areas: EXPERTISE_AREAS.length,
    accreditation_levels: LEVELS.length,
    phases: PHASES.length,
    phase_documents: PHASE_DOCUMENTS.length,
    requirement_areas: REQUIREMENT_AREAS.length,
    repository_folders: REPOSITORY_FOLDERS.length,
  };
  console.log("wrote supabase/seed.sql");
  for (const [table, n] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(22)} ${n}`);
  }
}
