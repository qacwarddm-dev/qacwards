"use client";

import { useState } from "react";
import { LVS } from "@/lib/qac-model";

export const CSTAT: [string, string][] = [
  ["PSV", "Candidate Status"],
  ["I", "Level I Accredited"],
  ["I", "Level I Re-accredited"],
  ["II", "Level II Re-accredited"],
  ["III", "Level III Re-accredited – Phase 1"],
  ["III", "Level III Re-accredited – Phase 2"],
  ["IV", "Level IV Re-accredited – Phase 1"],
  ["IV", "Level IV Re-accredited – Phase 2"],
];
export const CSDEF: Record<string, string> = { PSV: "Candidate Status", I: "Level I Accredited", II: "Level II Re-accredited", III: "Level III Re-accredited – Phase 1", IV: "Level IV Re-accredited – Phase 1" };

export default function CertStatusSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const known = CSTAT.some((c) => c[1] === value);
  const [other, setOther] = useState(!known && Boolean(value));
  return (
    <>
      <select
        className="inp"
        value={other ? "other" : value}
        onChange={(e) => {
          if (e.target.value === "other") {
            setOther(true);
            onChange("");
          } else {
            setOther(false);
            onChange(e.target.value);
          }
        }}
      >
        {LVS.map(([k, , g]) => (
          <optgroup key={k} label={g}>
            {CSTAT.filter((c) => c[0] === k).map((c) => (
              <option key={c[1]} value={c[1]}>
                {c[1]}
              </option>
            ))}
          </optgroup>
        ))}
        <option value="other">Other (type as written)…</option>
      </select>
      {other && <input className="inp" style={{ marginTop: 6 }} placeholder="Type the status exactly as on the certificate" value={value} onChange={(e) => onChange(e.target.value)} />}
    </>
  );
}

export const certLevel = (status: string) => CSTAT.find((c) => c[1] === status)?.[0] ?? null;
