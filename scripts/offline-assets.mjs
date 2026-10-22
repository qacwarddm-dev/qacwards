import { cpSync, mkdirSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { join } from "node:path";

const out = join(process.cwd(), "public", "offline");
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "tesseract"), { recursive: true });

const nm = join(process.cwd(), "node_modules");
const pkgDir = (name) => realpathSync(join(nm, name));

cpSync(join(pkgDir("pdfjs-dist"), "build", "pdf.worker.min.mjs"), join(out, "pdf.worker.min.mjs"));
cpSync(join(pkgDir("tesseract.js"), "dist", "worker.min.js"), join(out, "tesseract", "worker.min.js"));

// pnpm does not hoist tesseract.js-core; it sits beside tesseract.js in the store.
const core = join(pkgDir("tesseract.js"), "..", "tesseract.js-core");
for (const f of readdirSync(core).filter((n) => n.includes("-lstm"))) {
  cpSync(join(core, f), join(out, "tesseract", f));
}

cpSync(
  join(pkgDir("@tesseract.js-data/eng"), "4.0.0_best_int", "eng.traineddata.gz"),
  join(out, "tesseract", "eng.traineddata.gz"),
);
console.log("offline assets copied to public/offline");
