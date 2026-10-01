import "./portal.css";
import "./portal-extra.css";
import CommandPalette from "@/components/portal/CommandPalette";
import PortalSidebar from "@/components/portal/PortalSidebar";
import PortalTopBar from "@/components/portal/PortalTopBar";
import ToastProvider from "@/components/portal/kit/ToastProvider";
import { LAYER_ID } from "@/components/portal/kit/Modal";
import EvaluationPrompt from "@/components/portal/kit/EvaluationPrompt";
import { requireCurrentUser } from "@/lib/current-user";
import { getNavCounts } from "@/lib/nav-counts";
import { initialsOf } from "@/lib/program-names";
import { getCompletedVisits } from "@/lib/visit-evaluations";
import { getSetting } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/portal/kit/Card";
import Empty from "@/components/portal/kit/Empty";

export default async function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireCurrentUser();
  const [counts, visits, sec] = await Promise.all([
    getNavCounts(user),
    user.role === "program_representative" ? getCompletedVisits() : Promise.resolve([]),
    createClient().then((s) => getSetting(s, "security")),
  ]);
  const locked = sec.maint && user.role !== "qac_admin";

  return (
    <div className="qp">
      <ToastProvider>
        <PortalTopBar user={user} initials={initialsOf(user.name)} />
        <div className="wrap">
          <PortalSidebar user={user} counts={counts} />
          <main id="main">
            {locked ? (
              <Card>
                <Empty icon="🛠" title="Scheduled maintenance">
                  {sec.mmsg}
                </Empty>
              </Card>
            ) : (
              children
            )}
          </main>
        </div>
        <CommandPalette user={user} />
        {visits.length > 0 && <EvaluationPrompt visits={visits} />}
        <div id={LAYER_ID} />
      </ToastProvider>
    </div>
  );
}
