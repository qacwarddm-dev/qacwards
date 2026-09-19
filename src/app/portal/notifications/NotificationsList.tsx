"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { EmptyState, NotificationRow } from "@/components/portal/kit";
import type { PortalNotification } from "@/components/portal/data";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notification-actions";

/** Client half of `/portal/notifications` — needs the same mark-read/mark-all
 *  transitions the bell popover uses, just at page scale instead of a panel. */
export default function NotificationsList({
  items,
  unread,
}: {
  items: PortalNotification[];
  unread: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function openRow(n: PortalNotification) {
    startTransition(async () => {
      if (n.unread) await markNotificationRead(n.id);
      if (n.href) router.push(n.href);
      else router.refresh();
    });
  }

  function readAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  if (items.length === 0) {
    return <EmptyState variant="empty" title="No notifications yet." />;
  }

  return (
    <div className="max-w-[640px]">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={readAll}
          disabled={pending || unread === 0}
          className="text-regular font-semibold leading-none text-maroon transition-opacity hover:opacity-70 disabled:opacity-40"
        >
          Read All ({unread})
        </button>
      </div>

      {(["new", "earlier"] as const).map((section) => {
        const rows = items.filter((n) => n.section === section);
        if (!rows.length) return null;
        return (
          <div key={section} className="mt-[var(--space-5)]" role="log" aria-label={section}>
            <h2 className="t-h3 text-black">{section === "new" ? "New" : "Earlier"}</h2>
            <div className="mt-[var(--space-2)] flex flex-col gap-[8px]">
              {rows.map((n) => (
                <NotificationRow key={n.id} notification={n} onOpen={openRow} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
