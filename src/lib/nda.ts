import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const NDA_TEMPLATE_PATH = path.join(process.cwd(), "templates", "qac-nda.pdf");

// Crockford base32 minus I/L/O/U, so a hand-typed id can't confuse 1/I or 0/O.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const FILE_ID_RE = /^QAC-NDA-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;
const KEYWORD_PREFIX = "qac-nda-file-id:";

export function newNdaFileId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const chars = Array.from(bytes, (b) => ALPHABET[b % 32]).join("");
  return `QAC-NDA-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

export function normalizeNdaFileId(raw: string): string | null {
  const id = raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0");
  return FILE_ID_RE.test(id) ? id : null;
}

export async function stampNdaTemplate(fileId: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(await readFile(NDA_TEMPLATE_PATH));
  pdf.setKeywords([`${KEYWORD_PREFIX}${fileId}`]);
  pdf.setSubject(`QAC Non-Disclosure Agreement ${fileId}`);

  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const label = `NDA File ID: ${fileId}`;
  const size = 9;

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(label, size);
    page.drawText(label, {
      x: width - textWidth - 36,
      y: height - 24,
      size,
      font,
      color: rgb(0.502, 0, 0), // --color-maroon #800000
    });
  }

  return pdf.save();
}

export type NdaScanCheck = { ok: true } | { ok: false; error: string };

/**
 * A camera/scanner PDF has no text layer, so the only thing that can be read
 * back reliably is the unsigned template itself (its text layer and keyword
 * survive). This rejects that, and any file stamped with a different id.
 */
export async function checkNdaScan(bytes: Uint8Array, fileId: string): Promise<NdaScanCheck> {
  let keywords = "";
  try {
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
    keywords = pdf.getKeywords() ?? "";
  } catch {
    return { ok: false, error: "That PDF could not be read. It may be corrupt." };
  }

  const stamped = keywords.match(/qac-nda-file-id:(QAC-NDA-[0-9A-Z-]+)/)?.[1];
  if (stamped && stamped !== fileId) {
    return { ok: false, error: "This file belongs to a different NDA File ID." };
  }

  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: bytes.slice() });
  let text = "";
  try {
    text = (await parser.getText()).text ?? "";
  } catch {
    text = "";
  } finally {
    await parser.destroy().catch(() => {});
  }

  const textIds = [...text.matchAll(/QAC-NDA-[0-9A-Z]{4}-[0-9A-Z]{4}/g)].map((m) => m[0]);
  if (textIds.some((id) => id !== fileId)) {
    return { ok: false, error: "This file belongs to a different NDA File ID." };
  }

  const isBlankTemplate =
    Boolean(stamped) || (/NON-DISCLOSURE AGREEMENT/i.test(text) && !/notary/i.test(text));
  if (isBlankTemplate) {
    return {
      ok: false,
      error:
        "This is the unsigned form. Print it, sign it, have it notarized, then upload the scanned copy.",
    };
  }

  return { ok: true };
}
