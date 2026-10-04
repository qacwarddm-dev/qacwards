"use client";

import { useState } from "react";
import Btn from "./Btn";
import useAct from "./useAct";
import { shortDate } from "@/lib/program-names";

type Item = { id: string; title: string; sub?: string; deletedAt: string; kind?: "program" | "person" };
type Res = { ok: true } | { ok: false; error: string };

export default function RecentlyDeleted({
  items,
  onRestore,
  page,
  emptyText,
}: {
  items: Item[];
  onRestore: (id: string) => Promise<Res>;
  page?: boolean;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const { busy, run } = useAct();
  if (!items.length) return page ? <div className="empty">{emptyText ?? "Nothing deleted."}</div> : null;
  return (
    <div style={page ? undefined : { marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
      {!page && (
        <Btn variant="gh" sm onClick={() => setOpen(!open)}>
          {open ? "▾" : "▸"} Recently deleted ({items.length})
        </Btn>
      )}
      {(open || page) && (
        <div className="tscroll" style={page ? undefined : { marginTop: 8 }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Deleted</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={x.id}>
                  <td>
                    {!x.kind && <span className="pdfi">PDF</span>} {x.title}
                    {x.sub && <small>{x.sub}</small>}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{shortDate(x.deletedAt)}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <Btn
                      variant="o"
                      sm
                      disabled={busy}
                      onClick={() => run(() => onRestore(x.id), `“${x.title}” restored`)}
                    >
                      Restore
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
