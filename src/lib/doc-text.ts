import { strFromU8, unzipSync } from "fflate";

const MAX_CHARS = 300_000;

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function docxText(bytes: Uint8Array): string {
  const xml = unzipSync(bytes, { filter: (f) => f.name === "word/document.xml" })["word/document.xml"];
  if (!xml) return "";
  return strFromU8(xml)
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:(tab|br)\/>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e: string) =>
      e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENTITIES[e] ?? m),
    );
}

async function pdfText(bytes: Uint8Array, timeoutMs: number): Promise<string | null> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: bytes.slice() });
  try {
    const read = parser.getText().then((r) => r.text ?? "");
    return await Promise.race([read, new Promise<null>((res) => setTimeout(() => res(null), timeoutMs))]);
  } finally {
    await parser.destroy().catch(() => {});
  }
}

/** Searchable text of a PDF or .docx. `null` means it ran out of time, so a later
 *  pass may retry; `""` means there is nothing to read (a scan, a corrupt file). */
export async function extractText(bytes: Uint8Array, fileName: string, timeoutMs: number): Promise<string | null> {
  const name = fileName.toLowerCase();
  let text: string | null = "";
  try {
    if (name.endsWith(".pdf")) text = await pdfText(bytes, timeoutMs);
    else if (name.endsWith(".docx")) text = docxText(bytes);
  } catch {
    text = "";
  }
  if (text === null) return null;
  return text
    .replace(/^-- \d+ of \d+ --$/gm, "")
    .replace(/\u0000/g, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim()
    .slice(0, MAX_CHARS);
}
