import { createClient } from "@/lib/supabase/server";
import type { PortalNotification } from "@/components/portal/data";

/**
 * Reads behind the top-bar bell.
 *
 * Nothing here filters by recipient. The RLS policy on `notifications` is
 * `recipient_id = auth.uid()`, so a query without a `.eq()` returns your own
 * rows and only yours — and adding a redundant filter would mean the app and the
 * policy could one day disagree about who you are.
 *
 * The bell's own shape (`PortalNotification`) is kept, so the component that was
 * drawn against the Figma frame did not have to change: only where its list
 * comes from did.
 */

const AVATAR_FALLBACK = "/assets/portal/avatar-placeholder.png";

/** The frame prints "44m", "2d". Same vocabulary, computed. */
function relativeTime(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return `${Math.floor(days / 30)}mo`;
}

/** The dropdown splits at 24 hours, which is what "New" vs "Earlier" means on
 *  the frame — the divider is time, not read state. */
const NEW_WINDOW_MS = 24 * 60 * 60 * 1000;

export type BellData = {
  items: PortalNotification[];
  unread: number;
};

export async function getNotifications(limit = 20): Promise<BellData> {
  const supabase = await createClient();

  const [{ data }, { count }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, kind, title, body, link, read_at, created_at, actor:actor_id (avatar_path)")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
  ]);

  const items = (data ?? []).map((n) => ({
    id: n.id,
    avatar: n.actor?.avatar_path ?? AVATAR_FALLBACK,
    // The trigger already writes a whole sentence into `title`, so there is no
    // bold lead-in to split out. `name` stays optional and unset rather than
    // slicing the sentence apart to fake the frame's two-tone line.
    body: n.title,
    time: relativeTime(n.created_at),
    section:
      Date.now() - new Date(n.created_at).getTime() < NEW_WINDOW_MS
        ? ("new" as const)
        : ("earlier" as const),
    unread: n.read_at === null,
    href: n.link ?? undefined,
  }));

  return { items, unread: count ?? 0 };
}

/** The bell badge alone, for callers that render the count without the list. */
export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  return count ?? 0;
}
