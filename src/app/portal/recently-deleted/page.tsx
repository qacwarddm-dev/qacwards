import { redirect } from "next/navigation";
import QacRecentlyDeleted from "@/components/portal/screens/qac/QacRecentlyDeleted";
import { requireCurrentUser } from "@/lib/current-user";
import { getRecentlyDeleted } from "@/lib/recently-deleted";

export default async function RecentlyDeletedPage() {
  const user = await requireCurrentUser();
  if (user.role !== "qac_personnel" && user.role !== "qac_admin") redirect("/portal/dashboard");
  return <QacRecentlyDeleted data={await getRecentlyDeleted(user.role === "qac_admin")} />;
}
