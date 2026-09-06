import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BUCKETS, downloadFile } from "@/lib/storage";
import { stampUuid } from "@/lib/pdf";
import type { Database } from "@/lib/database.types";

/**
 * The Accreditation Visit Evaluation Form — round 2 §4's "'signed by' render
 * step wherever accreditor sign-off appears on output docs".
 *
 * This is that output doc. The Download button on the evaluation screens has
 * had no generator behind it since B9 (the same gap decision 18 recorded for
 * Reports), so §4's reuse half had nowhere to render a signature; building the
 * form is what makes a stored signature do anything at all.
 *
 * Deliberately not a Figma transcription — there is no frame for this document,
 * only a button that names it. It is laid out as a plain office form: the
 * identifying header the summary table already shows, the item decisions the
 * sheet already records, the verdict, then one signature block per accreditor
 * who accepted. Nothing on it is invented data; every line is a value read back
 * out of the database.
 *
 * Colours are the frozen tokens (`--color-maroon` #800000, `--color-gray`
 * #7B7979, black) and nothing else, so the printed form and the screen agree.
 */
const MAROON = rgb(0.5, 0, 0);
const GRAY = rgb(0.48, 0.47, 0.47);
const BLACK = rgb(0, 0, 0);

const PAGE = { width: 595.28, height: 841.89 }; // A4 portrait, points
const MARGIN = 54;

export type EvaluationFormResult =
  | { ok: true; bytes: Uint8Array; fileName: string }
  | { ok: false; error: string };

const DECISION_LABEL: Record<string, string> = {
  approved: "Approved",
  disapproved: "Disapproved",
  pending: "Not yet decided",
};

/** Manila, like every other date the portal prints (§8.4). */
function manilaDate(iso: string | null): string {
  return new Date(iso ?? Date.now()).toLocaleDateString("en-PH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
}

export async function buildEvaluationForm(
  supabase: SupabaseClient<Database>,
  assignmentId: string,
): Promise<EvaluationFormResult> {
  const { data: assignment } = await supabase
    .from("assignments")
    .select(
      `id, status, due_date,
       submissions(attempt, website_url,
                   programs(name, campuses(name), colleges(name, code)),
                   accreditation_levels(name)),
       assignment_accreditors(profile_id, response,
                              profiles(surname, given_name, signature_path)),
       evaluations(score, outcome, compliance_status, remarks, evaluated_at, released_at)`,
    )
    .eq("id", assignmentId)
    .maybeSingle();

  // Zero rows is also what RLS returns to someone who may not read this
  // assignment, so the caller turns both into the same 404 (§1).
  if (!assignment) return { ok: false, error: "Not found." };

  const evaluation = assignment.evaluations;

  const { data: itemRows } = await supabase
    .from("evaluation_items")
    .select("kind, label, decision, score, note, evaluations!inner(assignment_id)")
    .eq("evaluations.assignment_id", assignmentId);

  const items = itemRows ?? [];

  const pdf = await PDFDocument.create();
  const body = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  let page = pdf.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - MARGIN;

  /** Break to a new page when `needed` points would run off the bottom. The
   *  form's length is driven by how many documents the programme submitted, so
   *  a single fixed page would silently drop rows on a large submission. */
  function ensureSpace(needed: number) {
    if (y - needed >= MARGIN) return;
    page = pdf.addPage([PAGE.width, PAGE.height]);
    y = PAGE.height - MARGIN;
  }

  function line(
    text: string,
    { size = 10, font = body, color = BLACK, gap = 14, x = MARGIN } = {},
  ) {
    ensureSpace(gap);
    page.drawText(text, { x, y, size, font, color });
    y -= gap;
  }

  function rule(gap = 12) {
    ensureSpace(gap);
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE.width - MARGIN, y },
      thickness: 0.75,
      color: GRAY,
    });
    y -= gap;
  }

  /** Truncate to the printable width rather than letting pdf-lib run text off
   *  the page — a document title can be longer than the column it sits in. */
  function fit(text: string, size: number, width: number, font = body): string {
    if (font.widthOfTextAtSize(text, size) <= width) return text;
    let cut = text;
    while (cut.length > 1 && font.widthOfTextAtSize(`${cut}…`, size) > width) {
      cut = cut.slice(0, -1);
    }
    return `${cut}…`;
  }

  line("POLYTECHNIC UNIVERSITY OF THE PHILIPPINES", { size: 11, font: bold, color: MAROON });
  line("Quality Assurance Center", { size: 10, color: GRAY });
  y -= 6;
  line("ACCREDITATION VISIT EVALUATION FORM", { size: 14, font: bold, gap: 20 });
  rule(18);

  const submission = assignment.submissions;
  const facts: [string, string][] = [
    ["Programme", submission?.programs?.name ?? "—"],
    ["Campus", submission?.programs?.campuses?.name ?? "—"],
    [
      "College",
      submission?.programs?.colleges
        ? `${submission.programs.colleges.name} (${submission.programs.colleges.code})`
        : "—",
    ],
    ["Level applied for", submission?.accreditation_levels?.name ?? "—"],
    ["Attempt", String(submission?.attempt ?? 1)],
    ["Website", submission?.website_url ?? "Not submitted"],
  ];

  for (const [label, value] of facts) {
    ensureSpace(15);
    page.drawText(`${label}:`, { x: MARGIN, y, size: 10, font: bold, color: BLACK });
    page.drawText(fit(value, 10, PAGE.width - MARGIN * 2 - 130), {
      x: MARGIN + 130,
      y,
      size: 10,
      font: body,
      color: BLACK,
    });
    y -= 15;
  }

  y -= 8;
  rule(18);
  line("DOCUMENT REVIEW", { size: 11, font: bold, gap: 18 });

  if (items.length === 0) {
    line("No documents were submitted for this assignment.", { color: GRAY, gap: 18 });
  } else {
    for (const item of items) {
      ensureSpace(item.note ? 28 : 15);
      const decision = DECISION_LABEL[item.decision] ?? item.decision;
      page.drawText(fit(item.label, 10, 320), { x: MARGIN, y, size: 10, font: body });
      page.drawText(decision, {
        x: PAGE.width - MARGIN - 110,
        y,
        size: 10,
        font: bold,
        color: item.decision === "disapproved" ? MAROON : BLACK,
      });
      y -= 15;

      if (item.note) {
        page.drawText(fit(item.note, 9, PAGE.width - MARGIN * 2 - 12), {
          x: MARGIN + 12,
          y,
          size: 9,
          font: body,
          color: GRAY,
        });
        y -= 13;
      }
    }
    y -= 6;
  }

  rule(18);
  line("FINDINGS", { size: 11, font: bold, gap: 18 });
  line(`Score: ${evaluation?.score ?? "Not yet scored"}`, { gap: 15 });
  line(`Outcome: ${evaluation?.outcome ?? "Not yet recorded"}`, { gap: 15 });
  line(`Compliance status: ${evaluation?.compliance_status ?? "—"}`, { gap: 15 });
  line(`Remarks: ${fit(evaluation?.remarks ?? "—", 10, PAGE.width - MARGIN * 2 - 60)}`, {
    gap: 15,
  });
  line(
    `Score released: ${evaluation?.released_at ? manilaDate(evaluation.released_at) : "Not yet released"}`,
    { gap: 22 },
  );

  // ---------------------------------------------------------------- sign-off
  //
  // Only accreditors who accepted. Someone who declined took no part in the
  // findings above, and printing their mark under them is exactly the misuse a
  // stored signature invites (`getSignatories` applies the same rule on screen).
  const signatories = (assignment.assignment_accreditors ?? []).filter(
    (m) => m.response === "accepted",
  );

  rule(18);
  line("EVALUATED AND SIGNED BY", { size: 11, font: bold, gap: 8 });
  line(`Date: ${manilaDate(evaluation?.evaluated_at ?? null)}`, { size: 9, color: GRAY, gap: 26 });

  // Three across the printable width, so the right-hand block's rule ends on
  // the margin instead of running past it.
  const COLUMNS = 3;
  const blockGap = 24;
  const printable = PAGE.width - MARGIN * 2;
  const blockWidth = (printable - blockGap * (COLUMNS - 1)) / COLUMNS;
  const blockHeight = 100;
  let column = 0;
  let rowTop = y;

  for (const member of signatories) {
    if (column === 0 && rowTop - blockHeight < MARGIN) {
      page = pdf.addPage([PAGE.width, PAGE.height]);
      rowTop = PAGE.height - MARGIN;
    }

    const profile = member.profiles;
    const name = profile ? `${profile.surname}, ${profile.given_name}` : "—";
    const x = MARGIN + column * (blockWidth + blockGap);
    let drew = false;

    if (profile?.signature_path) {
      const file = await downloadFile(supabase, BUCKETS.signatures, profile.signature_path);
      if (file.data) {
        try {
          const png = await pdf.embedPng(file.data);
          // Fit inside the block, keeping the aspect ratio the pad exported at.
          const scale = Math.min(blockWidth / png.width, 46 / png.height);
          page.drawImage(png, {
            x: x + (blockWidth - png.width * scale) / 2,
            y: rowTop - 46 + (46 - png.height * scale) / 2,
            width: png.width * scale,
            height: png.height * scale,
          });
        } catch {
          // A signature that will not decode must not take the whole form down
          // with it — the printed name below is still a valid attribution.
        }
        drew = true;
      }
    }

    // The same fallback the on-screen `SignatureBlock` uses: an accreditor who
    // has captured no signature still signs, in name, over the rule. A blank
    // space above a printed name reads as an unsigned form.
    if (!drew) {
      const label = fit(name, 11, blockWidth, italic);
      page.drawText(label, {
        x: x + (blockWidth - italic.widthOfTextAtSize(label, 11)) / 2,
        y: rowTop - 42,
        size: 11,
        font: italic,
        color: GRAY,
      });
    }

    page.drawLine({
      start: { x, y: rowTop - 50 },
      end: { x: x + blockWidth, y: rowTop - 50 },
      thickness: 0.75,
      color: BLACK,
    });
    page.drawText(fit(name, 9, blockWidth, bold), {
      x,
      y: rowTop - 62,
      size: 9,
      font: bold,
      color: BLACK,
    });
    page.drawText("Internal Accreditor", {
      x,
      y: rowTop - 73,
      size: 8,
      font: body,
      color: GRAY,
    });

    column += 1;
    if (column === COLUMNS) {
      column = 0;
      rowTop -= blockHeight;
    }
  }

  if (signatories.length === 0) {
    line("No accreditor has accepted this assignment yet.", { color: GRAY });
  }

  const bytes = await pdf.save();
  const stamped = await stampUuid(bytes, assignment.id);

  // Capped: a programme title runs to sixty-odd characters and a filename built
  // from the whole of one is unusable in a downloads folder.
  const slug = (submission?.programs?.name ?? "evaluation")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
    // Back off to the last whole word so the name does not end mid-syllable.
    .replace(/-[^-]*$/, "");

  return { ok: true, bytes: stamped, fileName: `evaluation-form-${slug}.pdf` };
}
