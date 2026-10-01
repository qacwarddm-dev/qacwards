"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import Icon from "./kit/Icon";
import Empty from "./kit/Empty";
import { useToast } from "./kit/ToastProvider";
import type { PortalNotification } from "@/lib/notifications";
import type { PortalUser } from "./portal-nav";
import { createClient } from "@/lib/supabase/browser";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/notification-actions";

const KIND: Record<string, [string, string]> = {
  assignment_issued: ["👥", "#e8eefb"],
  assignment_response: ["⏳", "#f3f3f3"],
  submission_received: ["📄", "#fff6d6"],
  document_uploaded: ["📄", "#fff6d6"],
  document_disapproved: ["↺", "#fdecec"],
  score_released: ["📨", "#e8eefb"],
  event_scheduled: ["🗓", "#e8eefb"],
  award_expiring: ["⚠", "#fdecec"],
  account: ["🪪", "#fdecec"],
};

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function when(iso?: string) {
  if (!iso) return "";
  const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(d);
  const d = new Date(iso);
  const days = Math.round((new Date(day(new Date())).getTime() - new Date(day(d)).getTime()) / 864e5);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const [, m, dd] = day(d).split("-").map(Number);
  return `${MON[m - 1]} ${dd}`;
}

export function openCommandPalette() {
  document.dispatchEvent(new Event("qacwards:open-command-palette"));
}

export default function TopBarActions({
  user,
  initials,
  items,
  search,
}: {
  user: PortalUser;
  initials: string;
  items: PortalNotification[];
  search: boolean;
}) {
  const [open, setOpen] = useState<"nd" | "menu" | null>(null);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const unread = items.filter((n) => n.unread).length;

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const list = tab === "unread" ? items.filter((n) => n.unread) : items;
  const hasPhoto = !user.avatar.endsWith("avatar-placeholder.png");

  function openRow(n: PortalNotification) {
    setOpen(null);
    start(async () => {
      if (n.unread) await markNotificationRead(n.id);
      if (n.href) router.push(n.href);
      else router.refresh();
    });
  }

  function readAll() {
    start(async () => {
      await markAllNotificationsRead();
      toast.say("All notifications marked as read");
      router.refresh();
    });
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const ia = user.role === "internal_accreditor";

  return (
    <div className="hr">
      {search && (
        <button type="button" className="srch" onClick={openCommandPalette}>
          ⌕ <span>Search</span> <kbd>Ctrl K</kbd>
        </button>
      )}
      <button
        type="button"
        className="bell"
        aria-label={`Notifications (${unread} unread)`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(open === "nd" ? null : "nd");
        }}
      >
        <Icon name="bell" size={15} color="#800000" />
        {unread > 0 && <i>{unread}</i>}
      </button>
      <div className={`pop nd${open === "nd" ? " show" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="nd-h">
          <b>Notifications</b>
          <a className="lnk" role="button" onClick={readAll}>
            Mark all as read
          </a>
        </div>
        <div className="nd-t">
          <span className={tab === "all" ? "on" : ""} onClick={() => setTab("all")}>
            All
          </span>
          <span className={tab === "unread" ? "on" : ""} onClick={() => setTab("unread")}>
            Unread
          </span>
        </div>
        <div className="nd-l">
          {list.length ? (
            list.map((n) => {
              const [ic, bg] = KIND[n.kind ?? ""] ?? ["🔔", "#f3f3f3"];
              return (
                <div key={n.id} className={`ni${n.unread ? " unread" : ""}`} onClick={() => openRow(n)}>
                  <div className="ic" style={{ background: bg }}>
                    {ic}
                  </div>
                  <div style={{ flex: 1 }}>
                    {n.name && <b>{n.name} </b>}
                    {n.body}
                    <small>{when(n.at)}</small>
                  </div>
                  {n.unread && <span className="dot" />}
                </div>
              );
            })
          ) : (
            <Empty>You’re all caught up 🎉</Empty>
          )}
        </div>
      </div>
      <div
        className="me"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(open === "menu" ? null : "menu");
        }}
      >
        <div className="who">
          <b>{user.name}</b>
          <br />
          {user.position}
        </div>
        <div className="av" style={hasPhoto ? { backgroundImage: `url("${user.avatar}")`, backgroundSize: "cover", color: "transparent" } : undefined}>
          {initials}
        </div>
      </div>
      <div className={`pop menu${open === "menu" ? " show" : ""}`} onClick={(e) => e.stopPropagation()}>
        <a
          role="button"
          onClick={() => {
            setOpen(null);
            router.push("/portal/profile");
          }}
        >
          {ia ? "" : "👤 "}Profile
        </a>
        <a
          role="button"
          onClick={() => {
            setOpen(null);
            router.push("/portal/my-activity");
          }}
        >
          {ia ? "" : "⟲ "}My Activity
        </a>
        <a role="button" onClick={signOut}>
          {ia ? "" : "↪ "}Sign out
        </a>
      </div>
    </div>
  );
}
