import { getNotifications } from "@/lib/notifications";
import NotificationsList from "./NotificationsList";

/**
 * Full notifications page (09a §E.3 / 09-ui-refactor §5.1): the top-bar bell
 * popover has always truncated at `getNotifications()`'s default 20 rows with
 * no way to see the rest. This is that "See all" destination — same data,
 * a higher limit, no truncation message pretending the list ends where the
 * popover happened to stop.
 */
export default async function NotificationsPage() {
  const { items, unread } = await getNotifications(100);

  return (
    <div className="px-[var(--page-gutter)] py-[var(--space-7)] lg:px-[57px]">
      <h1 className="t-h1 text-black">Notifications</h1>
      <div className="mt-[var(--space-6)]">
        <NotificationsList items={items} unread={unread} />
      </div>
    </div>
  );
}
