/**
 * Title strip at the top of a dashboard card, with an optional action on the
 * right and an optional hairline beneath. 54px tall, measured off all four
 * cards on program_representative/01-Dashboard.png.
 *
 * Distinct from `PanelHeader`, which is a *page* heading (32px, no card, no
 * rule) used by Assignment and Reports.
 */
export default function CardTitleBar({
  title,
  action,
  divider = false,
}: {
  title: string;
  action?: React.ReactNode;
  /** The chart and uploads cards rule off their header; the other two do not. */
  divider?: boolean;
}) {
  return (
    <div
      className={`flex h-[54px] shrink-0 items-center justify-between px-[25px] ${
        divider ? "border-b border-[color:var(--color-gray)]/20" : ""
      }`}
    >
      {/* 15px, not 20: the cap-height reading was inflated by the descenders in
          "On-Going Program" / "Uploads", and ink width settles it at ~15.0. */}
      <h2 className="text-subheading font-semibold leading-none text-black">
        {title}
      </h2>
      {action}
    </div>
  );
}
