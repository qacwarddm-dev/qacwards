import InternalAccreditorDashboard from "@/components/portal/screens/InternalAccreditorDashboard";
import ProgramRepDashboard from "@/components/portal/screens/ProgramRepDashboard";
import QacPersonnelDashboard from "@/components/portal/screens/QacPersonnelDashboard";
import { getCurrentUser } from "@/lib/current-user";

/**
 * One URL, role-appropriate content. Every role's sidebar links to
 * `/portal/dashboard` in its own frames, so the route is shared and the screen
 * is chosen by the identity seam rather than by the path.
 *
 * Screens live in `components/portal/screens/` and take no props, so this file
 * stays a switch.
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (user.role === "program_representative") return <ProgramRepDashboard />;
  if (user.role === "internal_accreditor") return <InternalAccreditorDashboard />;
  return <QacPersonnelDashboard />;
}
