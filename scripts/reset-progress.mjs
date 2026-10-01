import { connect, fetchAll, snapshot, wipe, currentCounts, countdown } from "./progress-lib.mjs";

const execute = process.argv.includes("--execute");
const { db, host } = connect();

const before = await currentCounts(db);
console.log(`Target: ${host}`);
console.log("Rows to clear:", before.counts);
console.log("Storage files to clear:", before.files);
console.log("Submissions are deleted. Events of kind 'holiday' are kept, all other events are deleted:");
for (const e of await fetchAll(db, "events")) console.log(`  ${e.kind === "holiday" ? "KEEP  " : "DELETE"} ${e.start_time.slice(0, 10)} [${e.kind}] ${e.title}`);

if (!execute) {
  console.log("\nDry run. Re-run with --execute to back up and reset.");
  process.exit(0);
}

await countdown(5, `Backing up then resetting ${host}`);
const snap = await snapshot(db, "pre-reset");
console.log(`Backup saved: ${snap.dir}`);
await wipe(db);
const after = await currentCounts(db);
console.log("Done. Rows now:", after.counts, "files:", after.files);
console.log(`Undo with: node --env-file=.env scripts/restore-progress.mjs --execute "${snap.dir}"`);
