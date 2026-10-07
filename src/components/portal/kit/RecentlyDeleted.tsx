"use client";

import { useState } from "react";
import Btn from "./Btn";
import Modal from "./Modal";
import useAct from "./useAct";
import { shortDate } from "@/lib/program-names";

type Item = { id: string; title: string; sub?: string; deletedAt: string; kind?: "program" | "person" };
type Res = { ok: true } | { ok: false; error: string };

export default function RecentlyDeleted({
  items,
  onRestore,
  onDelete,
  page,
  emptyText,
}: {
  items: Item[];
  onRestore: (id: string) => Promise<Res>;
  onDelete?: (id: string) => Promise<Res>;
  page?: boolean;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<Item | null>(null);
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
                    <span style={{ display: "inline-flex", gap: 8 }}>
                      <Btn variant="o" sm disabled={busy} onClick={() => run(() => onRestore(x.id), `“${x.title}” restored`)}>
                        Restore
                      </Btn>
                      {onDelete && (
                        <Btn variant="d" sm disabled={busy} onClick={() => setDel(x)}>
                          Delete
                        </Btn>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {del && onDelete && (
        <Modal
          title="Delete permanently?"
          sub={del.title}
          onClose={() => setDel(null)}
          footer={
            <>
              <Btn variant="gh" onClick={() => setDel(null)}>
                Cancel
              </Btn>
              <Btn variant="danger" disabled={busy} onClick={() => run(() => onDelete(del.id), `“${del.title}” deleted permanently`, () => setDel(null))}>
                Delete permanently
              </Btn>
            </>
          }
        >
          <p className="sub" style={{ fontSize: 12.5 }}>
            This removes it from the system for good. It cannot be restored afterwards.
          </p>
        </Modal>
      )}
    </div>
  );
}
