/**
 * Grey rounded chip holding a blue uppercase filename — the document links on
 * the Internal Accreditor's evaluation sheet
 * (assets/FIGMA/internal_accreditor/03.1-DocumentEvaluation.png).
 *
 * That frame is a 1x export and cannot be pixel-verified, so the sizing here is
 * transcribed by eye and flagged for re-measurement when it is re-exported at
 * 2x. The blue is `--color-link`, added to the tokens for exactly this chip.
 */
export default function PdfChip({ name }: { name: string }) {
  return (
    <span className="inline-flex h-[24px] w-fit items-center whitespace-nowrap rounded-[6px] bg-[color:var(--color-gray)]/25 px-[10px] text-[9px] font-semibold uppercase leading-none text-[color:var(--color-link)]">
      {name}
      <span className="lowercase">.pdf</span>
    </span>
  );
}
