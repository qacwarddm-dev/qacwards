import type { StatusTone } from "./status";
import { TONE_FILL, TONE_TEXT } from "./status";

/** Small numeric/text badge — nav pending-work counts, tab counts. Reuses the
 *  status registry's tone→fill/text map so a badge and a pill never disagree
 *  about what a tone means. */
export default function Badge({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: StatusTone;
}) {
  return (
    <span
      className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-[5px] text-[10px] font-semibold leading-none ${TONE_TEXT[tone]} ${TONE_FILL[tone]}`}
    >
      {children}
    </span>
  );
}
