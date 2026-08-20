"use client";

import { Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { PortalNotification } from "./data";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notification-actions";

/**
 * Top-bar bell plus the dropdown it opens
 * (assets/FIGMA/qac_personnel/interactables/overall-notifications-button). The
 * frame is a 2x export, so every measurement here is halved. Split out of
 * PortalTopBar because the panel needs open/close state — the bar stays a server
 * component and passes the list down.
 *
 * B8 made the list real. Two affordances the frame drew were inert and now
 * work: "Read All (n)" and the All / Unread tabs. Geometry is unchanged.
 */
export default function NotificationBell({
  count,
  items,
}: {
  count: number;
  items: PortalNotification[];
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const visible = tab === "unread" ? items.filter((n) => n.unread) : items;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function openRow(n: PortalNotification) {
    startTransition(async () => {
      if (n.unread) await markNotificationRead(n.id);
      setOpen(false);
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

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        aria-label={`Notifications (${count})`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-[29px] w-[29px] items-center justify-center rounded-full bg-white"
      >
        <Bell
          className="h-[17px] w-[17px] text-maroon"
          fill="currentColor"
          strokeWidth={1.5}
        />
        {/* The badge is drawn only when there is something to count. A "0" in a
            red dot reads as an alert about nothing. */}
        {count > 0 && (
          <span className="absolute right-[-0.5px] top-[0.5px] flex h-[10px] w-[10px] items-center justify-center rounded-full bg-alert text-[7px] font-bold leading-none text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* click-away */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 top-[38px] z-50 w-[300px] rounded-[10px] bg-white px-[18px] pb-[18px] pt-[18px] text-black shadow-[0_8px_28px_rgba(0,0,0,0.2)]">
            <div className="flex items-start justify-between">
              <h2 className="text-heading font-bold leading-none">Notifications</h2>
              <button
                type="button"
                onClick={readAll}
                disabled={pending || count === 0}
                className="text-regular font-semibold leading-none text-maroon transition-opacity hover:opacity-70 disabled:opacity-40"
              >
                Read All ({count})
              </button>
            </div>

            <div className="mt-[18px] flex gap-[24px] text-subheading font-bold leading-none">
              {(["all", "unread"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={tab === t ? "text-black" : "text-gray"}
                >
                  {t === "all" ? "All" : "Unread"}
                </button>
              ))}
            </div>

            {visible.length === 0 && (
              <p className="mt-[24px] text-subheading leading-none text-gray">
                {tab === "unread" ? "Nothing unread." : "No notifications yet."}
              </p>
            )}

            {(["new", "earlier"] as const).map((section) => {
              const rows = visible.filter((n) => n.section === section);
              if (!rows.length) return null;
              return (
                <div key={section} role="log" aria-label={section} className="mt-[20px]">
                  <h3 className="text-regular font-bold leading-none text-black">
                    {section === "new" ? "New" : "Earlier"}
                  </h3>
                  <div className="mt-[8px] flex flex-col">
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
                          <p className="mt-[6px] text-regular leading-none text-link">
                            {n.time}
                          </p>
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

            <Link
              href="/portal/notifications"
              onClick={() => setOpen(false)}
              className="mt-[18px] block text-center text-regular font-semibold leading-none text-maroon transition-opacity hover:opacity-70"
            >
              See all
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
