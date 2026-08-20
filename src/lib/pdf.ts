import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * PDF validation and UUID stamping for uploaded submission documents.
 *
 * Two separate jobs that happen to share a file:
 *
 * 1. **Validate.** `accept="application/pdf"` on the input and the browser's
 *    reported MIME type are both trivially forged — renaming `payload.exe` to
 *    `report.pdf` satisfies each of them. Parsing the bytes is the only check
 *    that means anything, and it yields the page count for free.
 * 2. **Stamp.** A UUID written into the document itself, so a printed
 *    accreditation page traces back to one database row. This is a PRD
 *    non-functional guarantee (plans/BACKEND.md §0.2).
 */

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export type PdfCheck =
  | { ok: true; pageCount: number }
  | { ok: false; error: string };

/**
 * Confirm the bytes really are a PDF and report how many pages.
 *
 * `pdf-parse` v2 exposes a `PDFParse` class rather than v1's default-export
 * function, and `getInfo().total` is the page count. It is imported lazily so the
 * pdfjs bundle it pulls in stays out of every request that uploads nothing.
 */
export async function inspectPdf(bytes: Uint8Array): Promise<PdfCheck> {
  // %PDF- magic number. A cheap first gate that rejects the renamed-executable
  // case before handing anything to a parser.
  const header = new TextDecoder().decode(bytes.subarray(0, 5));
  if (header !== "%PDF-") {
    return { ok: false, error: "That file is not a PDF." };
  }

  const { PDFParse } = await import("pdf-parse");

  // **Must be a copy.** pdf.js transfers the ArrayBuffer it is handed to its
  // worker, which detaches the original — the caller's `bytes` would come back
  // zero-length, and the very next step (stampUuid) fails with "No PDF header
  // found" on a file that is perfectly valid. Caught by the round-trip test.
  const parser = new PDFParse({ data: bytes.slice() });

  try {
    const info = await parser.getInfo();
    if (!info.total || info.total < 1) {
      return { ok: false, error: "That PDF has no readable pages." };
    }
    return { ok: true, pageCount: info.total };
  } catch {
    return { ok: false, error: "That PDF could not be read. It may be corrupt." };
  } finally {
    // Releases the pdfjs worker. Skipping it leaks a worker per upload.
    await parser.destroy().catch(() => {});
  }
}

/**
 * Write `docUuid` into the PDF and return the new bytes.
 *
 * It goes in two places on purpose. The metadata keyword survives copying and
 * programmatic inspection but is invisible on paper; the footer line is small
 * grey type in the bottom margin of every page, which is the half that survives
 * being printed and photocopied. Either one alone leaves a gap.
 */
export async function stampUuid(
  bytes: Uint8Array,
  docUuid: string,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });

  pdf.setKeywords([`qac-doc-uuid:${docUuid}`]);
  pdf.setProducer("QAC-WARDDM");

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const label = `QAC-WARDDM ${docUuid}`;

  for (const page of pdf.getPages()) {
    const { width } = page.getSize();
    const size = 6;
    const textWidth = font.widthOfTextAtSize(label, size);
    page.drawText(label, {
      // Bottom margin, right-aligned, 18pt in from the edge — clear of the
      // content area on an A4 or Letter page either way.
      x: Math.max(18, width - textWidth - 18),
      y: 12,
      size,
      font,
      color: rgb(0.48, 0.47, 0.47), // --color-gray #7B7979
    });
  }

  return pdf.save();
}
