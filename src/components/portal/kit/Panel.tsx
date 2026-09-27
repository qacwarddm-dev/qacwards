import BackLink from "./BackLink";
import Card from "./Card";

/**
 * Full-width white panel: a 20px bold title, an optional action on the right,
 * then the body. 41px padding and a 24px title-to-body gap, measured off every
 * card on assets/FIGMA/program_representative/07-Submissions*.png (card top to
 * title cap 43.5, which is 41 of padding plus Inter's 2.7 of ascent).
 *
 * Distinct from `CardTitleBar` (a 54px strip *inside* a dashboard card, 15px
 * type) and from `PanelHeader` (a page heading with no card around it).
 */
export default function Panel({
  title,
  action,
  back,
  toolbar,
  footer,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  /**
   * Back affordance in the title row, drawn to the right of `action`. A prop
   * rather than "pass a `BackLink` as `action`", which is how the Submissions
   * screens used to do it: the evaluation sheet needs a back link *and* its
   * Download action, and one slot cannot hold both without the page inventing
   * its own flex row — which is the call-site styling the kit rules forbid.
   */
  back?: { href: string; to?: string };
  /**
   * A search/filter row sharing the title row (QAC's Accreditation Programs
   * list). Unlike `action`, the row grows to fit it: `action` is held to the
   * 20px title height so buttons there keep the measured title-to-body gap.
   */
  toolbar?: React.ReactNode;
  /** Right-aligned button under the body. Tightens the panel's bottom padding
   *  to 20, as the Phases and Requirements frames do. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className={`px-[41px] pt-[41px] ${footer ? "pb-[20px]" : "pb-[41px]"}`}>
      <div
        className={`flex items-center justify-between ${
          toolbar ? "min-h-[20px] flex-wrap gap-[16px]" : "h-[20px]"
        }`}
      >
        <h1 className="text-heading font-bold leading-none text-black">
          {title}
        </h1>
        {toolbar && <div className="min-w-0 flex-1">{toolbar}</div>}
        {(action || back) && (
          <div className="flex items-center gap-[24px]">
            {action}
            {back && <BackLink href={back.href} to={back.to} />}
          </div>
        )}
      </div>
      <div className="mt-[24px]">{children}</div>
      {footer && <div className="mt-[20px] flex justify-end">{footer}</div>}
    </Card>
  );
}
