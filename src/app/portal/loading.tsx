import { Skeleton } from "@/components/portal/kit";

/**
 * Generic portal-route skeleton — matches `PageHeader` + a stat row + a panel,
 * the shape most portal pages share. Screens whose shape differs materially
 * (documents, dashboard, tables) get their own `loading.tsx` override.
 */
export default function PortalLoading() {
  return (
    <div className="flex flex-col gap-[var(--space-6)] p-[var(--page-gutter)]">
      <div className="flex items-start justify-between gap-4">
        <Skeleton w={220} h={24} />
        <Skeleton w={120} h={36} radius="md" />
      </div>
      <div className="grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} h={96} radius="lg" />
        ))}
      </div>
      <Skeleton h={320} radius="lg" />
    </div>
  );
}
