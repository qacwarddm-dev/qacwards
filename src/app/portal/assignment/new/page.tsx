import { redirect } from "next/navigation";
import QacPersonnelCreateAssignment from "@/components/portal/screens/QacPersonnelCreateAssignment";
import { getCurrentUser } from "@/lib/current-user";

/**
 * `/portal/assignment/new` — the create form the QAC Personnel Assignment "New"
 * button opens (qac_personnel/03.1-Create new assignment). Only QAC Personnel
 * create assignments; any other role that lands here is bounced to the list.
 */
export default async function NewAssignmentPage() {
  const user = await getCurrentUser();

  if (user.role !== "qac_personnel") redirect("/portal/assignment");
  return <QacPersonnelCreateAssignment />;
}
