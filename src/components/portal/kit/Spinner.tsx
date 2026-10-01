export default function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="q-inline" role="status" aria-live="polite">
      <div className="q-ring" aria-hidden />
      {label}
    </div>
  );
}

export function MiniRing() {
  return <span className="q-ring sm" aria-hidden />;
}
