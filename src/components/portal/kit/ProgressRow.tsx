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
 *
 * `meta` and `right` widen the row for lists that need more than a label —
 * Extension Monitoring's Programs list (campus, level) and QAC's Feedback
 * list (campus, level, a star rating instead of a progress bar). `right`
 * replaces the percent bar; the chevron still always renders.
 *
 * `markerHref` splits the row into two independent click targets — the
 * Phases list's dropdown. Without it the whole row is one `Link` to `href`,
 * same as always; with it, the marker toggles its own target (an inline
 * expand, staying put) while the rest of the row — label, bar, chevron —
 * still goes to `href` (the next breadcrumb stage). Two `<a>`s can't nest, so
 * that case renders as a `div` holding two sibling `Link`s instead of one.
 *
 * `onClick` is `href`'s callback-driven sibling — Extension Monitoring opens
 * a review dialog rather than navigating, so the row renders a `<button>`
 * instead of a `Link`. The two are mutually exclusive; `href` wins if both
 * are somehow passed.
 */
export default function ProgressRow({
  label,
  meta,
  percent,
  right,
  href,
  onClick,
  markerHref,
  marker = true,
}: {
  label: string;
  /** Extra text columns between the label and the tail — e.g. campus, level. */
  meta?: string[];
  /** Omit for a label-only row. 0 dims the row, matching the frames. */
  percent?: number;
  /** Overrides the percent bar with custom content (e.g. a `StarRating`).
   *  The chevron still renders after it. */
  right?: React.ReactNode;
  href?: string;
  /** Callback-driven alternative to `href` — opens a dialog instead of
   *  navigating. Ignored when `href` or `markerHref` is set. */
  onClick?: () => void;
  /** When set, the marker becomes its own click target instead of sharing
   *  `href` with the rest of the row. */
  markerHref?: string;
  marker?: boolean;
}) {
  const dim = percent === 0 ? "opacity-50" : "";
  const className = `flex h-[57px] w-full items-center pr-[17px] ${
    marker ? "pl-[23px]" : "pl-[25.5px]"
  } ${(href || onClick) && !markerHref ? "transition-colors hover:bg-surface/60" : ""}`;

  const markerIcon = (
    <GitCommitHorizontal
      className="h-[20px] w-[20px] shrink-0 text-maroon"
      strokeWidth={1.5}
      aria-hidden
    />
  );

  const metaSpans = meta?.map((m, i) => (
    <span
      key={i}
      title={m}
      className="min-w-[150px] max-w-[220px] shrink-0 truncate text-subheading leading-none text-gray"
    >
      {m}
    </span>
  ));

  const tail = (
    <>
      {metaSpans}

      {right !== undefined ? (
        right
      ) : (
        percent !== undefined && (
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
        )
      )}

      <ChevronRight
        className="ml-[17px] h-[26px] w-[26px] shrink-0 text-[color:var(--color-gray)]/50"
        strokeWidth={2}
        aria-hidden
      />
    </>
  );

  if (markerHref) {
    const label_ = (
      <span className="min-w-0 flex-1 truncate text-subheading font-medium leading-none text-black">
        {label}
      </span>
    );

    return (
      <div className={className}>
        <Link
          href={markerHref}
          aria-label={`Toggle ${label}`}
          className={`flex shrink-0 items-center ${dim}`}
        >
          {marker && markerIcon}
        </Link>

        {href ? (
          <Link
            href={href}
            className="flex min-w-0 flex-1 items-center pl-[26px] transition-colors hover:opacity-80"
          >
            {label_}
            {tail}
          </Link>
        ) : (
          <span className="flex min-w-0 flex-1 items-center pl-[26px]">
            {label_}
            {tail}
          </span>
        )}
      </div>
    );
  }

  const body = (
    <>
      <span className={`flex min-w-0 flex-1 items-center gap-[26px] ${dim}`}>
        {marker && markerIcon}
        <span
          title={label}
          className="truncate text-subheading font-medium leading-none text-black"
        >
          {label}
        </span>
      </span>

      {tail}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} text-left`}>
        {body}
      </button>
    );
  }

  return <div className={className}>{body}</div>;
}
