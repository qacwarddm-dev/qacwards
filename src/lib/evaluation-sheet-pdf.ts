import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, type PDFFont, type PDFImage, type PDFPage, StandardFonts, rgb } from "pdf-lib";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { BUCKETS, downloadFile } from "@/lib/storage";
import { stampUuid } from "@/lib/pdf";
import {
  HEADER_KEYS,
  formatLongDate,
  levelLine,
  templateForLevel,
  type SheetValues,
} from "@/lib/evaluation-sheet";

export const PUP_SEAL_PATH = path.join(process.cwd(), "public", "assets", "logos", "pup.png");

const BLACK = rgb(0, 0, 0);
const PAGE = { width: 595.28, height: 841.89 };
const BOX = { left: 57, right: 538 };
const BOTTOM = 56;
const PAD = 6;

type Fonts = { body: PDFFont; bold: PDFFont; italic: PDFFont; boldItalic: PDFFont; sans: PDFFont };
type Line = { text: string; font: PDFFont; size: number; indent: number; height: number };

export type SheetPdfResult =
  | { ok: true; bytes: Uint8Array; fileName: string }
  | { ok: false; error: string };

/** Standard fonts are WinAnsi-only; a pasted emoji or CJK glyph would throw
 *  inside drawText and take the whole PDF down. */
function encodable(font: PDFFont, text: string): string {
  const set = new Set(font.getCharacterSet());
  return Array.from(text.replace(/\t/g, "    "))
    .map((ch) => (set.has(ch.codePointAt(0) ?? 0) ? ch : "?"))
    .join("");
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const out: string[] = [];
  for (const paragraph of encodable(font, text).split(/\r?\n/)) {
    if (paragraph.trim() === "") {
      out.push("");
      continue;
    }
    let current = "";
    for (const word of paragraph.split(/ +/)) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        current = candidate;
        continue;
      }
      if (current) out.push(current);
      let rest = word;
      while (font.widthOfTextAtSize(rest, size) > width) {
        let cut = rest.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > width) cut--;
        out.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      current = rest;
    }
    out.push(current);
  }
  return out;
}

export async function buildEvaluationSheetPdf(
  supabase: SupabaseClient<Database>,
  assignmentId: string,
): Promise<SheetPdfResult> {
  const { data: assignment } = await supabase
    .from("assignments")
    .select(
      `id, site_visit_date,
       submissions(programs(name, campuses(name), colleges(name)), accreditation_levels(code, name)),
       assignment_accreditors(response, profiles(surname, given_name, signature_path)),
       evaluations(sheet, evaluated_at)`,
    )
    .eq("id", assignmentId)
    .maybeSingle();

  if (!assignment) return { ok: false, error: "Not found." };

  const submission = assignment.submissions;
  const levelCode = submission?.accreditation_levels?.code ?? null;
  const template = templateForLevel(levelCode);
  const raw = (assignment.evaluations?.sheet ?? {}) as Record<string, unknown>;
  const values: SheetValues = Object.fromEntries(
    Object.entries(raw).filter((e): e is [string, string] => typeof e[1] === "string"),
  );

  const pdf = await PDFDocument.create();
  const fonts: Fonts = {
    body: await pdf.embedFont(StandardFonts.TimesRoman),
    bold: await pdf.embedFont(StandardFonts.TimesRomanBold),
    italic: await pdf.embedFont(StandardFonts.TimesRomanItalic),
    boldItalic: await pdf.embedFont(StandardFonts.TimesRomanBoldItalic),
    sans: await pdf.embedFont(StandardFonts.Helvetica),
  };

  let seal: PDFImage | null = null;
  try {
    seal = await pdf.embedPng(await readFile(PUP_SEAL_PATH));
  } catch {
    seal = null;
  }

  let page!: PDFPage;
  let y = 0;

  function drawHeader() {
    const top = PAGE.height - 36;
    if (seal) page.drawImage(seal, { x: 72, y: top - 62, width: 62, height: 62 });
    const x = 148;
    page.drawText("Republic of the Philippines", { x, y: top - 12, size: 9, font: fonts.sans });
    page.drawText("POLYTECHNIC UNIVERSITY OF THE PHILIPPINES", {
      x,
      y: top - 27,
      size: 13,
      font: fonts.body,
    });
    page.drawText("VICE PRESIDENT FOR ACADEMIC AFFAIRS", {
      x,
      y: top - 42,
      size: 11,
      font: fonts.body,
      color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText("QUALITY ASSURANCE CENTER", { x, y: top - 58, size: 13, font: fonts.bold });
    page.drawText("QAC FORM NO.005", { x: 438, y: top - 58, size: 8, font: fonts.bold });
    page.drawLine({
      start: { x: 70, y: top - 64 },
      end: { x: 530, y: top - 64 },
      thickness: 0.6,
      color: BLACK,
    });
    y = top - 90;
  }

  function newPage() {
    page = pdf.addPage([PAGE.width, PAGE.height]);
    drawHeader();
  }

  function centered(text: string, font: PDFFont, size: number, gap: number) {
    const t = encodable(font, text);
    page.drawText(t, {
      x: (PAGE.width - font.widthOfTextAtSize(t, size)) / 2,
      y,
      size,
      font,
    });
    y -= gap;
  }

  /** One bordered cell of the findings table. Splits across pages, closing
   *  the border at the bottom of one page and reopening it on the next. */
  function cell(lines: Line[], { center = false } = {}) {
    if (y - 2 * PAD - (lines[0]?.height ?? 0) < BOTTOM) newPage();
    let segTop = y;
    y -= PAD;
    const close = () =>
      page.drawRectangle({
        x: BOX.left,
        y,
        width: BOX.right - BOX.left,
        height: segTop - y,
        borderColor: BLACK,
        borderWidth: 0.8,
      });
    for (const line of lines) {
      if (y - line.height < BOTTOM) {
        close();
        newPage();
        segTop = y;
        y -= PAD;
      }
      y -= line.height;
      if (line.text) {
        const x = center
          ? (PAGE.width - line.font.widthOfTextAtSize(line.text, line.size)) / 2
          : BOX.left + 6 + line.indent;
        page.drawText(line.text, { x, y: y + 3, size: line.size, font: line.font });
      }
    }
    y -= PAD;
    close();
  }

  const innerWidth = BOX.right - BOX.left - 12;
  const toLines = (
    text: string,
    font: PDFFont,
    size: number,
    indent = 0,
    lead = 1.25,
  ): Line[] =>
    wrap(text, font, size, innerWidth - indent).map((t) => ({
      text: t,
      font,
      size,
      indent,
      height: size * lead,
    }));
  const gap = (h: number): Line => ({ text: "", font: fonts.body, size: 1, indent: 0, height: h });

  newPage();

  template.titleLines.forEach((line, i) =>
    centered(line, i < template.titleLines.length - 1 ? fonts.bold : fonts.body, 10.5, 13),
  );
  y -= 14;

  const program = submission?.programs?.name ?? "";
  const branch = submission?.programs?.colleges?.name ?? submission?.programs?.campuses?.name ?? "";
  const visitDate = values[HEADER_KEYS.visitDate] || assignment.site_visit_date;
  const info: [string, string][] = [
    ["Program", program],
    ["College/Branch", branch],
    ["Date of Simulation", visitDate ? formatLongDate(visitDate) : ""],
    ["Area/s Evaluated", values[HEADER_KEYS.areasEvaluated] ?? ""],
    ["Level of Survey Visit", levelLine(levelCode, submission?.accreditation_levels?.name ?? "")],
  ];
  const valueX = 200;
  const valueWidth = BOX.right - valueX;
  for (const [label, value] of info) {
    const rows = wrap(value || " ", fonts.body, 10, valueWidth - 4);
    rows.forEach((row, i) => {
      if (i === 0) {
        page.drawText(label, { x: 72, y, size: 10, font: fonts.bold });
        page.drawText(":", { x: 186, y, size: 10, font: fonts.body });
      }
      page.drawText(row, { x: valueX + 4, y, size: 10, font: fonts.body });
      page.drawLine({
        start: { x: valueX, y: y - 3 },
        end: { x: BOX.right, y: y - 3 },
        thickness: 0.8,
        color: BLACK,
      });
      y -= 14;
    });
  }
  y -= 18;

  cell([gap(8), ...toLines("IQAC FINDINGS & RECOMMENDATIONS", fonts.bold, 11.5), gap(8)], {
    center: true,
  });

  const groups: string[] = [];
  for (const s of template.sections) if (!groups.includes(s.group)) groups.push(s.group);

  for (const group of groups) {
    const lines: Line[] = [];
    for (const section of template.sections.filter((s) => s.group === group)) {
      const indent = section.indent ? 54 : 0;
      const label = section.chosenAreaKey
        ? `${section.label} ${values[section.chosenAreaKey]?.trim() || "__________________"}`
        : section.label;
      if (lines.length > 0) lines.push(gap(8));
      lines.push(...toLines(label, fonts.bold, 10, indent));
      const answer = values[section.key]?.trim();
      if (answer) lines.push(gap(2), ...toLines(answer, fonts.body, 10, indent));
      lines.push(gap(10));
    }
    cell(lines);
  }

  cell(toLines("Reminders", fonts.boldItalic, 10.5));
  template.reminders.forEach((r, i) => {
    cell(toLines(`${i + 1}.  ${r}`, fonts.body, 9, 6, 1.2));
  });

  const blockHeight = 92;
  const accepted = (assignment.assignment_accreditors ?? []).filter(
    (m) => m.response === "accepted",
  );
  const needed = 40 + Math.max(1, accepted.length) * blockHeight;
  y -= 24;
  if (y - needed < BOTTOM) {
    newPage();
  }

  const leftX = 70;
  const rightX = 318;
  const colWidth = 210;
  page.drawText("Evaluated by:", { x: leftX + 8, y, size: 10.5, font: fonts.body });
  page.drawText("Received by:", { x: rightX + 8, y, size: 10.5, font: fonts.body });
  y -= 18;

  const evaluatedAt = assignment.evaluations?.evaluated_at ?? null;
  const signOff = (
    x: number,
    top: number,
    caption: string,
    name: string | null,
    signature: PDFImage | null,
    date: string,
  ) => {
    const ruleY = top - 60;
    if (signature) {
      const scale = Math.min((colWidth - 40) / signature.width, 44 / signature.height);
      const w = signature.width * scale;
      const h = signature.height * scale;
      page.drawImage(signature, { x: x + (colWidth - w) / 2, y: ruleY + 6, width: w, height: h });
    }
    if (name) {
      const t = encodable(fonts.bold, name.toUpperCase());
      page.drawText(t, {
        x: x + (colWidth - fonts.bold.widthOfTextAtSize(t, 10)) / 2,
        y: ruleY + 3,
        size: 10,
        font: fonts.bold,
      });
    }
    page.drawLine({
      start: { x, y: ruleY },
      end: { x: x + colWidth, y: ruleY },
      thickness: 0.8,
      color: BLACK,
    });
    const small = "(Signature over Printed Name)";
    page.drawText(small, {
      x: x + (colWidth - fonts.body.widthOfTextAtSize(small, 7.5)) / 2,
      y: ruleY - 10,
      size: 7.5,
      font: fonts.body,
    });
    page.drawText(caption, {
      x: x + (colWidth - fonts.body.widthOfTextAtSize(caption, 10.5)) / 2,
      y: ruleY - 23,
      size: 10.5,
      font: fonts.body,
    });
    page.drawText(date, { x: x + 8, y: ruleY - 38, size: 10.5, font: fonts.body });
  };

  const signedOn = evaluatedAt ? `Date: ${formatLongDate(evaluatedAt)}` : "Date:";
  let top = y;
  signOff(rightX, top, "QA Coordinator / Chairperson/HAP", null, null, "Date");
  const members = accepted.length > 0 ? accepted : [null];
  for (const member of members) {
    if (top - blockHeight < BOTTOM) {
      newPage();
      top = y;
    }
    const profile = member?.profiles ?? null;
    let signature: PDFImage | null = null;
    if (profile?.signature_path) {
      const file = await downloadFile(supabase, BUCKETS.signatures, profile.signature_path);
      if (file.data) {
        try {
          signature = await pdf.embedPng(file.data);
        } catch {
          signature = null;
        }
      }
    }
    const name = profile ? `${profile.given_name} ${profile.surname}` : null;
    signOff(leftX, top, "Internal Quality Assurance Champion", name, signature, signedOn);
    top -= blockHeight;
  }

  const bytes = await pdf.save();
  const stamped = await stampUuid(bytes, assignment.id);

  const slug = (program || "evaluation")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
    .replace(/-[^-]*$/, "");
  const level = (levelCode ?? "").toLowerCase();

  return { ok: true, bytes: stamped, fileName: `ia-evaluation-sheet-${level}-${slug}.pdf` };
}
