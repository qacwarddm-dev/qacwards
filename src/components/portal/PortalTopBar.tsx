import { getNotifications } from "@/lib/notifications";
import TopBarActions from "./TopBarActions";
import type { PortalUser } from "./portal-nav";
import Link from "next/link";

export default async function PortalTopBar({ user, initials }: { user: PortalUser; initials: string }) {
  const { items } = await getNotifications(30);
  return (
    <header>
      <Link className="brand" href="/portal/dashboard">
        <img src="/assets/portal/mockup/seal.png" alt="" />
        <div>
          <small>POLYTECHNIC UNIVERSITY OF THE PHILIPPINES</small>
          <b>QUALITY ASSURANCE CENTER</b>
        </div>
      </Link>
      <TopBarActions user={user.role === "internal_accreditor" ? { ...user, position: "Internal Accreditor" } : user} initials={initials} items={items} search={user.role !== "internal_accreditor"} />
    </header>
  );
}
