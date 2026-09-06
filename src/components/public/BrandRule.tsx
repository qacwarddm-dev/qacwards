/**
 * The site's divider: 4px maroon over a gold hairline. The About page drew this
 * by hand three different ways (`border-y-[20px] border-maroon`, `h-5 bg-maroon`,
 * a one-off `#E1C16E` border); one component is what stops a fourth appearing.
 */
export function BrandRule({ className = "" }: { className?: string }) {
  return (
    <div
      role="presentation"
      className={`mx-auto w-full max-w-[var(--content-max)] px-[var(--page-gutter)] ${className}`}
    >
      <div className="rule-brand" />
    </div>
  );
}
