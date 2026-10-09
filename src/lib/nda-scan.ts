import jsQR from "jsqr";
import type { PDFPageProxy } from "pdfjs-dist";
import { normalizeNdaFileId } from "@/lib/nda-id";

export type NdaFields = { id: string; atty: string; doc: string; page: string; book: string; series: string };

const MAX_PAGES = 3;
// ~240 dpi on a long-bond page: enough for Tesseract on stamp-sized type.
const RENDER_WIDTH = 2000;

const LOOKALIKE_DIGITS: Record<string, string> = { O: "0", o: "0", D: "0", Q: "0", l: "1", I: "1", i: "1", "|": "1", "!": "1", S: "5", s: "5", B: "8", Z: "2", z: "2" };
const NUM = "[0-9OoDQlIi|!SsBZz]{1,6}";
const NO = "(?:No|Nos|Number|N0|Na)\\.?\\s*[:.,;]?\\s*";

function digits(raw: string | undefined): string {
  const d = [...(raw ?? "")].map((c) => LOOKALIKE_DIGITS[c] ?? c).join("");
  return /^\d{1,6}$/.test(d) ? String(Number(d)) : "";
}

function titleCase(s: string): string {
  return s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s.'-])(\p{L})/gu, (_, p, c) => p + c.toUpperCase()) : s;
}

function attorney(text: string): string {
  const lines = text.split("\n").map((l) => l.trim());
  let raw = "";
  const atty = lines.find((l) => /\bATTY\b/i.test(l));
  if (atty) raw = atty.slice(atty.search(/\bATTY\b/i));
  else {
    const i = lines.findIndex((l) => /notary\s+public/i.test(l));
    if (i > 0) raw = lines[i - 1];
  }
  const name = raw
    .replace(/[,;]?\s*notary\s+public.*$/i, "")
    .replace(/[^\p{L}\s.,'-]/gu, "")
    .replace(/\s+/g, " ")
    .replace(/^atty\.?\s*/i, "")
    .replace(/[\s,.-]+$/, "")
    .trim();
  if (name.split(" ").length < 2 || name.length < 5 || name.length > 60) return "";
  return `Atty. ${titleCase(name)}`;
}

export function parseNotarial(text: string): Omit<NdaFields, "id"> {
  const flat = text.replace(/[ \t]+/g, " ");
  // The jurat always runs Doc/Page/Book/Series, so when OCR drops the "Doc." word
  // (it overlaps signature lines often), the bare "No." just above "Page No." is it.
  const doc =
    flat.match(new RegExp(`\\bDoc(?:ument)?\\.?\\s*${NO}(${NUM})`, "i"))?.[1] ??
    flat.match(new RegExp(`\\b${NO}(${NUM})\\b[^\\n]*\\n[^\\n]*?\\bPage\\s*${NO}`, "i"))?.[1];
  const page = flat.match(new RegExp(`\\bPage\\s*${NO}(${NUM})`, "i"))?.[1];
  const book = flat.match(new RegExp(`\\bBook\\s*${NO}([IVXLC]{1,8}\\b|${NUM})`, "i"))?.[1];
  const series = flat.match(/\bSeries\s*(?:of|0f)?\s*[:.,;]?\s*((?:19|20)\s?\d\s?\d)\b/i)?.[1];
  return {
    atty: attorney(text),
    doc: digits(doc),
    page: digits(page),
    book: book && /^[IVXLC]+$/i.test(book) ? book.toUpperCase() : digits(book),
    series: series?.replace(/\s/g, "") ?? "",
  };
}

export function fileIdsInText(text: string): string[] {
  return [...text.matchAll(/QAC\W{0,2}NDA\W{0,2}([0-9A-Z]{4})\W{0,2}([0-9A-Z]{4})/gi)]
    .map((m) => normalizeNdaFileId(`QAC-NDA-${m[1]}-${m[2]}`))
    .filter((id): id is string => Boolean(id));
}

function mismatches(a: string, b: string): number {
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
  return n;
}

/** `issued` is what the server handed this account, so an OCR read one or two
 *  characters off still lands on the real id. */
export function pickFileId(candidates: string[], issued: string[]): string {
  const exact = candidates.find((c) => issued.includes(c));
  if (exact) return exact;
  let best = "";
  let score = 3;
  for (const c of candidates) {
    for (const id of issued) {
      const m = mismatches(c, id);
      if (m < score) [best, score] = [id, m];
    }
  }
  if (best) return best;
  if (issued.length === 1) return issued[0];
  return candidates[0] ?? "";
}

async function render(page: PDFPageProxy): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale: RENDER_WIDTH / page.getViewport({ scale: 1 }).width });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  await page.render({ canvas, viewport }).promise;
  return canvas;
}

function readQr(canvas: HTMLCanvasElement): string | null {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const { width: w, height: h } = canvas;
  const regions: [number, number, number, number][] = [
    [0, 0, w, h],
    [w / 2, (h * 2) / 3, w / 2, h / 3],
  ];
  for (const [x, y, rw, rh] of regions) {
    const img = ctx.getImageData(Math.round(x), Math.round(y), Math.round(rw), Math.round(rh));
    const hit = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
    const id = hit && normalizeNdaFileId(hit.data);
    if (id) return id;
  }
  return null;
}

export async function scanNda(file: File, issued: string[], onProgress?: (pct: number) => void): Promise<Partial<NdaFields>> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = Math.min(doc.numPages, MAX_PAGES);
  const candidates: string[] = [];
  let text = "";
  let current = 0;
  let worker: import("tesseract.js").Worker | null = null;

  try {
    for (let i = 1; i <= pages; i++) {
      current = i - 1;
      const page = await doc.getPage(i);
      const layer = await page.getTextContent();
      text += layer.items.map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : " ") : "")).join("") + "\n";
      const canvas = await render(page);
      const qr = readQr(canvas);
      if (qr) candidates.unshift(qr);

      if (!worker) {
        const { createWorker } = await import("tesseract.js");
        worker = await createWorker("eng", 1, {
          logger: (m) => {
            if (m.status === "recognizing text") onProgress?.(Math.round(((current + m.progress) / pages) * 100));
          },
        });
      }
      const { data } = await worker.recognize(canvas);
      text += data.text + "\n";

      const sofar = parseNotarial(text);
      if (Object.values(sofar).every(Boolean) && (candidates.length || fileIdsInText(text).length)) break;
    }
  } finally {
    await worker?.terminate();
    await doc.destroy();
  }

  return { id: pickFileId([...candidates, ...fileIdsInText(text)], issued), ...parseNotarial(text) };
}
