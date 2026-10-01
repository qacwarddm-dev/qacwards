export function Skel({ w = "100%", h = 12, r }: { w?: string; h?: number; r?: string }) {
  return <div className="q-skel" aria-hidden style={{ width: w, height: h, borderRadius: r }} />;
}

export default function PageSkeleton({ tiles = 4, rows = 5 }: { tiles?: number; rows?: number }) {
  return (
    <div aria-busy="true" role="status">
      <span className="sr-only">Loading…</span>
      <div className="stats">
        {Array.from({ length: tiles }, (_, i) => (
          <div key={i} className="st q-sk-st">
            <Skel w="55%" h={10} />
            <div style={{ height: 10 }} />
            <Skel w="40%" h={24} />
            <div style={{ height: 8 }} />
            <Skel w="70%" h={9} />
          </div>
        ))}
      </div>
      <div className="card">
        <Skel w="28%" h={16} />
        <div style={{ marginTop: 14 }}>
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="q-sk-row">
              <Skel w="80%" h={12} />
              <Skel w="60%" h={12} />
              <Skel w="70%" h={20} r="99px" />
              <Skel w="50%" h={12} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
