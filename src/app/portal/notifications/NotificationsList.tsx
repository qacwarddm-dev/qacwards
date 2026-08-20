"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { EmptyState } from "@/components/portal/kit";
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
            <div className="mt-[var(--space-2)] flex flex-col">
              {rows.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openRow(n)}
                  className={`flex items-start gap-[16px] rounded-[16px] px-[20px] py-[14px] text-left transition-opacity hover:opacity-85 ${
                    n.unread ? "bg-highlight" : ""
                  }`}
                >
                  <Image
                    src={n.avatar}
                    alt=""
                    width={94}
                    height={94}
                    className="h-[47px] w-[47px] shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-subheading leading-[20px] text-black">
                      {n.name && <span className="font-bold">{n.name} </span>}
                      {n.body}
                    </p>
                    <p className="mt-[6px] text-regular leading-none text-link">{n.time}</p>
                  </div>
                  {n.unread && (
                    <span className="mt-[3px] h-[10px] w-[10px] shrink-0 self-center rounded-full bg-link" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
