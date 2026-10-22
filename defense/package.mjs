import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { zipSync } from "fflate";

const EXCLUDE = [
  /^\.env/, /^node_modules\//, /^\.next/, /^graphify-out\//, /^\.shots\//, /^test-results\//,
  /^claude-code-handoff\//, /^\.code-review-graph\//, /^\.claude\//, /^\.mcp\.json$/,
  /^assets\/(FIGMA|OTHERS)\//, /^plans\//, /^tests\//, /^\.git\//, /^HANDOFF\.md$/, /tsbuildinfo$/,
  /^defense\/(\.run|backups|dist)\//, /^defense\/images\.tar$/, /^public\/offline\//, /^supabase\/\.(temp|branches)\//,
  /^(a11y|autha11y|authkbd|authshot|contrast|nav|probe|screenshot-admin|screenshot-mobile|shot|shot2|shot3)\.mjs$/,
  /^src\/app\/zzpreview\//,
];

const files = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { encoding: "utf8", maxBuffer: 1 << 26 })
  .split("\0")
  .filter((f) => f && !EXCLUDE.some((re) => re.test(f)));

const tree = {};
for (const f of files) {
  try {
    if (statSync(f).isFile()) tree[`qacwards/${f}`] = new Uint8Array(readFileSync(f));
  } catch {}
}

const out = join("defense", "dist");
mkdirSync(out, { recursive: true });
const zip = join(out, "qacwards-defense.zip");
writeFileSync(zip, zipSync(tree, { level: 6 }));
console.log(`${Object.keys(tree).length} files -> ${zip} (${(statSync(zip).size / 1e6).toFixed(1)} MB)`);
