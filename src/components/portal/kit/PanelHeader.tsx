/**
 * Bold panel title with an optional action on the right — the
 * "Accreditation Assignment" / "Report Generation" row.
 */
export default function PanelHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex h-[32px] items-center justify-between">
      <h1 className="text-heading font-semibold leading-none text-black">{title}</h1>
      {action}
    </div>
  );
}
