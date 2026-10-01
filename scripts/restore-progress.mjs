import { connect, snapshot, wipe, restore, latestBackup, currentCounts, countdown } from "./progress-lib.mjs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const execute = process.argv.includes("--execute");
const dir = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? (await latestBackup());
if (!dir) throw new Error("No backup found in data/progress-backups");

const { db, host } = connect();
const manifest = JSON.parse(await readFile(path.join(dir, "manifest.json"), "utf8"));
console.log(`Target: ${host}`);
console.log(`Snapshot: ${dir} (taken ${manifest.created_at})`);
console.log("Rows in snapshot:", manifest.counts);
console.log("Files in snapshot:", manifest.files);
console.log("Rows now:", (await currentCounts(db)).counts);

if (!execute) {
  console.log("\nDry run. Re-run with --execute to replace the current progress with this snapshot.");
  process.exit(0);
}

await countdown(5, `Restoring snapshot into ${host}`);
const safety = await snapshot(db, "pre-restore");
console.log(`Current state backed up first: ${safety.dir}`);
await wipe(db);
await restore(db, dir);
console.log("Restored. Rows now:", (await currentCounts(db)).counts);
