import { ChevronRight, GitCommitHorizontal } from "lucide-react";
import Link from "next/link";

/**
 * One drill-down row inside a `RowList`: an optional commit marker, a label, an
 * optional progress bar with its percentage, and a chevron.
 *
 * Geometry measured off assets/FIGMA/program_representative/07-Submissions.png —
 * 57px tall, bar 251x10 fully rounded on a `surface` track, percentage centred
 * in a 60px column. The chevron keeps full contrast on every row; only the
 * marker, label, bar and percentage dim, which is why `opacity-50` sits on an
 * inner span rather than on the row.
 *
 * A row with no `percent` (the Requirements list) drops the marker and the bar
 * and starts its label where the marker would have been.
 */
export default function ProgressRow({
  label,
  percent,
  href,
  marker = true,
}: {
  label: string;
  /** Omit for a label-only row. 0 dims the row, matching the frames. */
  percent?: number;
  href?: string;
  marker?: boolean;
}) {
  const dim = percent === 0 ? "opacity-50" : "";
  const className = `flex h-[57px] items-center pr-[17px] ${
    marker ? "pl-[23px]" : "pl-[25.5px]"
  } ${href ? "transition-colors hover:bg-surface/60" : ""}`;

  const body = (
    <>
      <span className={`flex min-w-0 flex-1 items-center gap-[26px] ${dim}`}>
        {marker && (
          <GitCommitHorizontal
            className="h-[20px] w-[20px] shrink-0 text-maroon"
            strokeWidth={1.5}
            aria-hidden
          />
        )}
        <span className="truncate text-subheading font-medium leading-none text-black">
          {label}
        </span>
      </span>

      {percent !== undefined && (
        <>
          <span className={`h-[10px] w-[251px] shrink-0 rounded-full bg-surface ${dim}`}>
            <span
              className="block h-full rounded-full bg-yellow"
              style={{ width: `${percent}%` }}
            />
          </span>
          <span
            className={`ml-[30px] w-[60px] shrink-0 text-center text-subheading font-semibold leading-none text-black ${dim}`}
          >
            {percent}%
          </span>
        </>
      )}

      <ChevronRight
        className="ml-[17px] h-[26px] w-[26px] shrink-0 text-[color:var(--color-gray)]/50"
        strokeWidth={2}
        aria-hidden
      />
    </>
  );

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
