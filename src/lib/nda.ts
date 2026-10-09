import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";

export const NDA_TEMPLATE_PATH = path.join(process.cwd(), "templates", "qac-nda.pdf");

const KEYWORD_PREFIX = "qac-nda-file-id:";

export async function stampNdaTemplate(fileId: string, template?: Uint8Array): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(template ?? (await readFile(NDA_TEMPLATE_PATH)));
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
    drawQr(page, fileId);
  }

  return pdf.save();
}

// Bottom-right, clear of the built-in form's footer logos (they end at x 548pt,
// 76pt above the bottom edge). The upload screen reads the File ID from this.
const QR_SIZE = 54;
const QR_RIGHT = 36;
const QR_BOTTOM = 18;

function drawQr(page: PDFPage, fileId: string) {
  const { modules } = QRCode.create(fileId, { errorCorrectionLevel: "M" });
  const n = modules.size;
  const cell = QR_SIZE / n;
  const x0 = page.getSize().width - QR_RIGHT - QR_SIZE;
  const quiet = cell * 2;
  page.drawRectangle({ x: x0 - quiet, y: QR_BOTTOM - quiet, width: QR_SIZE + quiet * 2, height: QR_SIZE + quiet * 2, color: rgb(1, 1, 1) });
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; ) {
      if (!modules.get(r, c)) {
        c++;
        continue;
      }
      let run = 1;
      while (c + run < n && modules.get(r, c + run)) run++;
      page.drawRectangle({ x: x0 + c * cell, y: QR_BOTTOM + (n - 1 - r) * cell, width: run * cell, height: cell, color: rgb(0, 0, 0) });
      c += run;
    }
  }
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

  let text = "";
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: bytes.slice() });
    try {
      const read = parser.getText({ first: 3 }).then((r) => r.text ?? "");
      text = await Promise.race([read, new Promise<string>((res) => setTimeout(() => res(""), 6000))]);
    } finally {
      await parser.destroy().catch(() => {});
    }
  } catch {
    text = "";
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
