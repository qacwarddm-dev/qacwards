"use client";

import { Bell } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { PortalNotification } from "./data";

/**
 * Top-bar bell plus the dropdown it opens
 * (assets/FIGMA/qac_personnel/interactables/overall-notifications-button). The
 * frame is a 2x export, so every measurement here is halved. Split out of
 * PortalTopBar because the panel needs open/close state — the bar stays a server
 * component and passes the fake list down.
 */
export default function NotificationBell({
  count,
  items,
}: {
  count: number;
  items: PortalNotification[];
}) {
  const [open, setOpen] = useState(false);

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
        <span className="absolute right-[-0.5px] top-[0.5px] flex h-[10px] w-[10px] items-center justify-center rounded-full bg-alert text-[7px] font-bold leading-none text-white">
          {count}
        </span>
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
                className="text-regular font-semibold leading-none text-maroon transition-opacity hover:opacity-70"
              >
                Read All ({count})
              </button>
            </div>

            <div className="mt-[18px] flex gap-[24px] text-subheading font-bold leading-none">
              <span className="text-black">All</span>
              <span className="text-gray">Unread</span>
            </div>

            {(["new", "earlier"] as const).map((section) => {
              const rows = items.filter((n) => n.section === section);
              if (!rows.length) return null;
              return (
                <div key={section} className="mt-[20px]">
                  <h3 className="text-regular font-bold leading-none text-black">
                    {section === "new" ? "New" : "Earlier"}
                  </h3>
                  <div className="mt-[8px] flex flex-col">
                    {rows.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-[16px] rounded-[16px] px-[20px] py-[14px] ${
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
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
