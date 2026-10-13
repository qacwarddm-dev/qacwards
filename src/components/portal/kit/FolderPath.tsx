"use client";

import BackLink from "./BackLink";

export default function FolderPath({ root, trail, onGo }: { root: string; trail: { id: string; name: string }[]; onGo: (id: string | null) => void }) {
  const parent = trail.length > 1 ? trail[trail.length - 2] : null;
  return (
    <div className="ch" style={{ margin: "4px 0 10px" }}>
      <div className="crumb" style={{ margin: 0 }}>
        <a role="button" onClick={() => onGo(null)}>
          {root}
        </a>
        {trail.map((f, i) => (
          <span key={f.id}>
            {" › "}
            {i === trail.length - 1 ? (
              f.name
            ) : (
              <a role="button" onClick={() => onGo(f.id)}>
                {f.name}
              </a>
            )}
          </span>
        ))}
      </div>
      <BackLink to={parent?.name ?? root} onClick={() => onGo(parent?.id ?? null)} />
    </div>
  );
}
