import Breadcrumb, { type Crumb } from "./Breadcrumb";

/**
 * Every portal page currently opens with a bespoke measured `div`
 * (`px-[81px] pt-[19px]`, `px-[57px] pt-[45px]`…) and several have no `<h1>`
 * at all. This owns the title, the one `<h1>`, the breadcrumb, the
 * description and the action slot so a page stops re-deriving that layout.
 */
export default function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  meta,
}: {
  title: string;
  description?: string;
  breadcrumb?: Crumb[];
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[var(--space-3)]">
      {breadcrumb && breadcrumb.length > 1 && <Breadcrumb items={breadcrumb} variant="trail" />}
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-4)]">
        <div className="min-w-0">
          <h1 className="t-h1 text-black">{title}</h1>
          {description && <p className="t-body mt-[var(--space-1)] text-gray">{description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-[var(--space-3)]">
          {meta}
          {actions}
        </div>
      </div>
    </div>
  );
}
