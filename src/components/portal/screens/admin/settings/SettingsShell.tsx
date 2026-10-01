import Link from "next/link";
import { Fragment } from "react";
import { STABS, type SettingsTab } from "@/lib/settings-model";

export default function SettingsShell({ tab, children }: { tab: SettingsTab; children: React.ReactNode }) {
  return (
    <div className="setw">
      <aside className="snav">
        {STABS.map(([g, L]) => (
          <Fragment key={g}>
            <div className="sng">{g}</div>
            {L.map(([k, l, i]) => (
              <Link key={k} className={tab === k ? "on" : undefined} href={`/portal/settings?tab=${k}`} scroll={false}>
                <span>{i}</span>
                {l}
              </Link>
            ))}
          </Fragment>
        ))}
      </aside>
      <div className="sbody">{children}</div>
    </div>
  );
}
