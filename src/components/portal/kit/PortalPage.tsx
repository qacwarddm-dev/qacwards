import PageHeader from "./PageHeader";
import type { Crumb } from "./Breadcrumb";

/**
 * Every portal page currently opens with a bespoke measured `div`
 * (`px-[81px] pt-[19px]`, `px-[57px] pt-[45px]`, `px-[44.5px]`…) — several
 * have no `<h1>` at all. This owns the gutter, the max width, the vertical
 * rhythm, `PageHeader` (title/breadcrumb/description/actions) and the
 * page-load stagger (09-ui-refactor §5.3 / 09b §5).
 *
 * Adopted screen-by-screen in Phase 4/5, not retrofitted onto every route at
 * once — a page keeps its current wrapper until its own PR touches it.
 */
export default function PortalPage({
  title,
  description,
  breadcrumb,
  actions,
  meta,
  width = "content",
  children,
}: {
  title: string;
  description?: string;
  breadcrumb?: Crumb[];
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  /** `content` caps at --content-max (1180px); `full` caps at --page-max (1440px). */
  width?: "content" | "full";
  children: React.ReactNode;
}) {
  const maxWidth = width === "full" ? "var(--page-max)" : "var(--content-max)";
  return (
    <div
      className="mx-auto flex flex-col gap-[var(--space-6)] px-[var(--page-gutter)] py-[var(--space-7)]"
      style={{ maxWidth }}
    >
      <PageHeader
        title={title}
        description={description}
        breadcrumb={breadcrumb}
        actions={actions}
        meta={meta}
      />
      <div className="motion-safe:animate-[page-in_var(--motion-base)_var(--ease-out)]">
        {children}
      </div>
    </div>
  );
}
