#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  closeSync, cpSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync,
} from "node:fs";
import { createConnection } from "node:net";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RUN = join(ROOT, "defense", ".run");
const BACKUPS = join(ROOT, "defense", "backups");
const IMAGES = join(ROOT, "defense", "images.tar");
const ENV_FILE = join(ROOT, ".env.local");
const PORT = 3000;
const APP_URL = `http://127.0.0.1:${PORT}`;
const PNPM = "pnpm@11.1.3";
const WIN = process.platform === "win32";

// Local-only fixture password for every demo account. The Supabase stack is
// bound to this machine, so this is not a credential for anything real.
const DEMO_PASSWORD = "DefenseDemo2026!";
const DB = "supabase_db_qacwards";
const STORAGE = "supabase_storage_qacwards";
const EXCLUDED_SERVICES = "studio,postgres-meta,realtime";

const say = (m) => console.log(`\n==> ${m}`);
const fail = (m) => {
  console.error(`\nERROR: ${m}`);
  process.exit(1);
};

function run(cmd, args, opts = {}) {
  // docker and node are real executables and take their arguments as they are. Through cmd.exe, which is what
  // `shell: true` means on Windows, the arguments are glued into one unquoted line: a path with a space splits
  // ("C:\Program Files\nodejs\node.exe" runs as "C:\Program"), SQL splits at its spaces, and `>` in
  // `setTimeout(()=>{})` becomes a file redirect. Only npx (npx.cmd) and the findstr/grep line need a shell.
  const native = cmd === "docker" || cmd === process.execPath;
  const shell = opts.shell ?? (WIN && !native);
  return spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28, ...opts, shell });
}

function must(cmd, args, opts = {}) {
  const r = run(cmd, args, { stdio: "inherit", ...opts });
  if (r.status !== 0) fail(`"${cmd} ${args.join(" ")}" failed (exit ${r.status}).`);
  return r;
}

const npx = (args, opts) => run("npx", args, opts);
const supabase = (args, opts) => npx(["--no-install", "supabase", ...args], opts);
const docker = (args, opts) => run("docker", args, opts);

function psql(sql, { file, vars = [] } = {}) {
  const args = ["exec", "-i", DB, "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-tA", ...vars.flatMap((v) => ["-v", v])];
  if (sql) args.push("-c", sql);
  return docker(args, file ? { input: readFileSync(file) } : {});
}

function sh(cmd) {
  return run(cmd, [], { shell: true });
}

function preflight() {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 22) fail(`Node.js 22 or newer is required (found ${process.versions.node}).`);
  const r = docker(["info"]);
  if (r.status !== 0) fail("Docker is not running. Open Docker Desktop, wait until it says \"running\", then try again.");
}

function ensureDeps() {
  if (!existsSync(join(ROOT, "node_modules", "next"))) {
    say("Installing dependencies (one time, needs internet)");
    must("npx", ["--yes", PNPM, "install", "--frozen-lockfile"]);
  }
  if (!existsSync(join(ROOT, "public", "offline", "tesseract", "eng.traineddata.gz"))) {
    must(process.execPath, ["scripts/offline-assets.mjs"]);
  }
}

function loadSavedImages() {
  if (!existsSync(IMAGES)) return;
  const marker = join(RUN, "images-loaded");
  if (existsSync(marker)) return;
  say("Loading bundled Docker images (no internet needed)");
  must("docker", ["load", "-i", IMAGES]);
  writeFileSync(marker, new Date().toISOString());
}

function parseEnv(text) {
  try {
    return JSON.parse(text);
  } catch {}
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function startSupabase() {
  say("Starting local Supabase (Docker)");
  let r;
  for (let attempt = 0; attempt < 3; attempt++) {
    r = supabase(["start", "-x", EXCLUDED_SERVICES], { stdio: "inherit" });
    if (r.status === 0) break;
    // Docker releases the published ports a moment after a stop; an immediate restart can hit "address already in use".
    run(process.execPath, ["-e", "setTimeout(()=>{},6000)"]);
  }
  if (r.status !== 0) fail("Supabase did not start. Run `defense doctor`, and see the troubleshooting guide.");
  const st = supabase(["status", "-o", "env"]);
  if (st.status !== 0) fail("Could not read `supabase status`.");
  const env = parseEnv(st.stdout);
  if (!env.API_URL || !env.ANON_KEY) fail("`supabase status` did not report API_URL / ANON_KEY.");
  return env;
}

function migrate() {
  say("Applying any pending migrations (never resets data)");
  must("npx", ["--no-install", "supabase", "migration", "up", "--local"]);
}

function verifyGrants() {
  const r = psql("select has_table_privilege('authenticated','public.profiles','select')");
  const answer = (r.stdout ?? "").trim();
  if (answer === "t") return;
  // Anything but t/f means the check itself did not run, which is a different problem from missing grants.
  if (answer !== "f") {
    const why = ((r.stderr ?? "").trim() || answer || `exit ${r.status}`).slice(0, 400);
    fail(`Could not check the database (${why}). Is Docker running, and is the ${DB} container up? Try \`node defense/cli.mjs doctor\`.`);
  }
  fail("The database was created without Data API grants, so the app cannot read any table. Apply the pending migrations (`npx --no-install supabase migration up --local`) and start again.");
}

function cronSecret() {
  const f = join(RUN, "cron-secret");
  if (existsSync(f)) return readFileSync(f, "utf8").trim();
  const s = randomBytes(24).toString("hex");
  writeFileSync(f, s);
  return s;
}

// Every key the app reads is set explicitly, blanks included: Next gives
// `.env.local` priority over `.env`, so a developer's cloud `.env` can never
// leak into a defense run.
function writeEnv(sb) {
  const lines = [
    "# Generated by defense/cli.mjs on every start. Local Supabase only.",
    `NEXT_PUBLIC_SUPABASE_URL=${sb.API_URL}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${sb.ANON_KEY}`,
    "SUPABASE_SERVICE_ROLE_KEY=",
    `SITE_URL=${APP_URL}`,
    "NEXT_PUBLIC_OFFLINE_ASSETS=1",
    "SMTP_HOST=127.0.0.1",
    "SMTP_PORT=54325",
    "SMTP_AUTH=none",
    "SMTP_USER=",
    "SMTP_PASS=",
    "SMTP_FROM=QAC-WARDS <no-reply@qacwards.local>",
    "MAILER_EMAIL=mailer@pup.edu.ph",
    `MAILER_PASSWORD="${DEMO_PASSWORD}"`,
    `CRON_SECRET=${cronSecret()}`,
    "",
  ];
  const next = lines.join("\n");
  const prev = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8") : "";
  if (prev === next) return false;
  if (prev && !prev.startsWith("# Generated by defense/cli.mjs")) {
    writeFileSync(`${ENV_FILE}.before-defense`, prev);
  }
  writeFileSync(ENV_FILE, next);
  return true;
}

function seedIfEmpty() {
  const r = psql("select count(*) from auth.users");
  if (r.status !== 0) fail(`Could not query the database: ${r.stderr}`);
  if (Number(r.stdout.trim()) > 0) return;
  say("Empty database: loading demo accounts and sample records");
  for (const f of ["supabase/seed-dev.sql", "defense/demo-data.sql"]) {
    const s = psql(null, { file: join(ROOT, f), vars: [`devpw=${DEMO_PASSWORD}`] });
    if (s.status !== 0) fail(`Loading ${f} failed:\n${s.stderr}`);
  }
}

// An earlier demo-data.sql gave accreditor2-4 an empty password (see the note in that file). A database that
// was already loaded keeps them, so any of these accounts still holding the empty password gets the demo one.
// An empty password is never legitimate, so this touches nothing anyone set on purpose.
function repairDemoPasswords() {
  const r = psql(
    `update auth.users set encrypted_password = extensions.crypt('${DEMO_PASSWORD}', extensions.gen_salt('bf')), updated_at = now() ` +
      `where email in ('accreditor2@pup.edu.ph','accreditor3@pup.edu.ph','accreditor4@pup.edu.ph') ` +
      `and encrypted_password = extensions.crypt('', encrypted_password) returning email`,
  );
  const fixed = (r.stdout ?? "").trim();
  if (r.status === 0 && fixed) say(`Repaired the demo password for: ${fixed.split(/\s+/).join(", ")}`);
}

function needsBuild(stamp) {
  const f = join(ROOT, ".next", ".defense-build");
  return !existsSync(join(ROOT, ".next", "BUILD_ID")) || !existsSync(f) || readFileSync(f, "utf8") !== stamp;
}

function build(stamp, force) {
  if (!force && !needsBuild(stamp)) return;
  say("Building the app (first start takes a few minutes)");
  must(process.execPath, ["node_modules/next/dist/bin/next", "build"]);
  writeFileSync(join(ROOT, ".next", ".defense-build"), stamp);
}

function portOpen(port) {
  return new Promise((res) => {
    const s = createConnection({ port, host: "127.0.0.1" });
    s.once("connect", () => (s.destroy(), res(true)));
    s.once("error", () => res(false));
  });
}

async function waitForApp() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(APP_URL, { redirect: "manual" });
      if (r.status < 500) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

function openBrowser(url) {
  const [cmd, args] = WIN ? ["cmd", ["/c", "start", "", url]] : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
  try {
    spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
  } catch {}
}

async function startApp() {
  const pidFile = join(RUN, "next.pid");
  if (await portOpen(PORT)) {
    say(`Something is already listening on port ${PORT}; assuming it is the app.`);
    return;
  }
  say("Starting the app");
  const log = openSync(join(RUN, "next.log"), "a");
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(PORT)], {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", log, log],
  });
  child.unref();
  closeSync(log);
  writeFileSync(pidFile, String(child.pid));
  if (!(await waitForApp())) fail(`The app did not answer on ${APP_URL}. See defense/.run/next.log`);
}

function banner() {
  console.log(`
============================================================
 QAC-WARDS is running (offline / local mode)

   App:     ${APP_URL}      <- open this one
   Mailpit: http://127.0.0.1:54324   (verification codes / emails)

   Demo password for every account: ${DEMO_PASSWORD}
     qac@pup.edu.ph          QAC Personnel
     admin@pup.edu.ph        QAC Admin
     rep@pup.edu.ph          Program Representative (CCIS)
     rep2@pup.edu.ph         Program Representative (Engineering)
     accreditor@pup.edu.ph   Internal Accreditor
     accreditor2..4@pup.edu.ph  more accreditors

   Stop with: stop.bat (Windows) / sh defense/stop.sh
============================================================`);
}

async function start(flags) {
  mkdirSync(RUN, { recursive: true });
  preflight();
  ensureDeps();
  loadSavedImages();
  const sb = startSupabase();
  migrate();
  verifyGrants();
  writeEnv(sb);
  seedIfEmpty();
  repairDemoPasswords();
  build(`${sb.API_URL}|${sb.ANON_KEY}`, flags.includes("--rebuild"));
  await startApp();
  banner();
  if (!flags.includes("--no-browser")) openBrowser(APP_URL);
}

function killTree(pid) {
  if (WIN) run("taskkill", ["/PID", String(pid), "/T", "/F"]);
  else {
    try {
      process.kill(-pid, "SIGTERM");
    } catch {
      try {
        process.kill(pid, "SIGTERM");
      } catch {}
    }
  }
}

function stop() {
  const pidFile = join(RUN, "next.pid");
  if (existsSync(pidFile)) {
    say("Stopping the app");
    killTree(Number(readFileSync(pidFile, "utf8")));
    rmSync(pidFile, { force: true });
  }
  say("Stopping Supabase (data is kept)");
  supabase(["stop"], { stdio: "inherit" });
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function backup(name) {
  preflight();
  if (docker(["inspect", DB]).status !== 0) fail("The database container is not running. Start the system first.");
  const dir = join(BACKUPS, name || stamp());
  mkdirSync(dir, { recursive: true });
  say(`Backing up to ${dir}`);

  const out = openSync(join(dir, "db.sql"), "w");
  const r = spawnSync(
    "docker",
    [
      "exec", DB, "pg_dump", "-U", "supabase_admin", "-d", "postgres",
      "--data-only", "--disable-triggers", "--no-owner",
      "-n", "public", "-n", "auth", "-n", "storage",
      "-T", "auth.schema_migrations", "-T", "storage.migrations",
    ],
    { stdio: ["ignore", out, "inherit"], shell: false },
  );
  closeSync(out);
  if (r.status !== 0) fail("pg_dump failed.");

  mkdirSync(join(dir, "storage"), { recursive: true });
  must("docker", ["cp", `${STORAGE}:/mnt/.`, join(dir, "storage")]);
  writeFileSync(join(dir, "MANIFEST.txt"), `QAC-WARDS backup\ncreated: ${new Date().toISOString()}\n`);
  console.log(`Backup complete: ${dir}`);
  return dir;
}

async function restore(name, flags) {
  preflight();
  if (!name) fail("Usage: restore <backup-folder-name>   (see defense/backups)");
  const dir = existsSync(name) ? resolve(name) : join(BACKUPS, name);
  if (!existsSync(join(dir, "db.sql"))) fail(`No db.sql in ${dir}`);
  if (docker(["inspect", DB]).status !== 0) fail("The database container is not running. Start the system first.");

  if (!flags.includes("--yes")) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const a = await rl.question(`This REPLACES all current data with the backup "${name}". A safety backup is taken first. Type YES to continue: `);
    rl.close();
    if (a.trim() !== "YES") fail("Cancelled.");
  }

  const safety = backup(`pre-restore-${stamp()}`);
  console.log(`Safety backup kept at ${safety}`);

  say("Restoring database");
  const wipe = `
    do $$
    declare t text;
    begin
      for t in
        select format('%I.%I', schemaname, tablename) from pg_tables
         where (schemaname = 'public')
            or (schemaname = 'auth' and tablename <> 'schema_migrations')
            or (schemaname = 'storage' and tablename <> 'migrations')
      loop
        execute 'truncate table ' || t || ' restart identity cascade';
      end loop;
    end $$;`;
  let r = docker(["exec", "-i", DB, "psql", "-U", "supabase_admin", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", wipe]);
  if (r.status !== 0) fail(`Clearing current data failed:\n${r.stderr}`);
  const body = `set session_replication_role = replica;\n${readFileSync(join(dir, "db.sql"), "utf8")}`;
  r = docker(["exec", "-i", DB, "psql", "-U", "supabase_admin", "-d", "postgres", "-v", "ON_ERROR_STOP=1"], { input: body });
  if (r.status !== 0) fail(`Loading the backup failed:\n${r.stderr}\nYour previous data is in ${safety}`);

  say("Restoring uploaded files");
  docker(["exec", "-u", "root", STORAGE, "sh", "-c", "rm -rf /mnt/* /mnt/.[!.]* 2>/dev/null; true"]);
  if (existsSync(join(dir, "storage"))) {
    must("docker", ["cp", `${join(dir, "storage")}${WIN ? "\\" : "/"}.`, `${STORAGE}:/mnt`]);
    docker(["exec", "-u", "root", STORAGE, "chmod", "-R", "a+rwX", "/mnt"]);
  }
  console.log("Restore complete. Refresh the browser.");
}

function listBackups() {
  if (!existsSync(BACKUPS)) return console.log("No backups yet.");
  for (const d of readdirSync(BACKUPS).filter((n) => statSync(join(BACKUPS, n)).isDirectory())) console.log(d);
}

function saveImages() {
  preflight();
  const ps = docker(["ps", "--format", "{{.Names}}"]);
  const names = ps.stdout.split(/\r?\n/).filter((n) => n.startsWith("supabase_") && n.endsWith("_qacwards"));
  if (!names.length) fail("Start the system first so the images in use can be found.");
  const imgs = [...new Set(names.map((n) => docker(["inspect", "-f", "{{.Config.Image}}", n]).stdout.trim()))];
  say(`Saving ${imgs.length} images to defense/images.tar (several GB)`);
  must("docker", ["save", "-o", IMAGES, ...imgs]);
}

async function doctor() {
  let bad = 0;
  const ok = (m) => console.log(`  ok    ${m}`);
  const no = (m) => (bad++, console.log(`  FAIL  ${m}`));
  const major = Number(process.versions.node.split(".")[0]);
  (major >= 22 ? ok : no)(`Node.js ${process.versions.node} (need 22+)`);
  (docker(["info"]).status === 0 ? ok : no)("Docker daemon reachable");
  for (const [p, label] of [[54321, "Supabase API"], [54322, "Postgres"], [54324, "Mailpit"], [PORT, "App"]]) {
    (await portOpen(p)) ? ok(`${label} is up on :${p}`) : console.log(`  --    ${label} not listening on :${p}`);
  }
  if (existsSync(ENV_FILE)) {
    const env = parseEnv(readFileSync(ENV_FILE, "utf8"));
    const url = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    (/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url) ? ok : no)(`.env.local Supabase URL is local (${url || "unset"})`);
  } else console.log("  --    .env.local not generated yet (created on first start)");
  const built = join(ROOT, ".next", "static");
  if (existsSync(built)) {
    const g = sh(WIN ? `findstr /s /m /r "[a-z0-9][a-z0-9]*[a-z0-9]\.supabase\.co" "${built}\\*.js"` : `grep -rlE "[a-z0-9]{20}\\.supabase\\.co" "${built}"`);
    (g.stdout.trim() === "" ? ok : no)("built browser bundle contains no <project>.supabase.co address");
  }
  console.log(bad ? `\n${bad} problem(s) found.` : "\nAll checks passed.");
  process.exit(bad ? 1 : 0);
}

const [cmd, ...rest] = process.argv.slice(2);
const flags = rest.filter((a) => a.startsWith("--"));
const args = rest.filter((a) => !a.startsWith("--"));

const commands = {
  start: () => start(flags),
  stop: async () => stop(),
  backup: async () => backup(args[0]),
  restore: () => restore(args[0], flags),
  backups: async () => listBackups(),
  "save-images": async () => saveImages(),
  doctor,
};

if (!commands[cmd]) {
  console.log("Usage: node defense/cli.mjs <start|stop|backup [name]|restore <name>|backups|save-images|doctor> [--rebuild] [--no-browser] [--yes]");
  process.exit(cmd ? 1 : 0);
}
await commands[cmd]();
