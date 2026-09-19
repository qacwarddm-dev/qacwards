import { Building2 } from "lucide-react";
import { Card, SectionHeading } from "@/components/portal/kit";
import ProgramManagement from "@/components/portal/screens/ProgramManagement";
import { getProgramsByCollege } from "@/lib/admin";

/**
 * Program Management (2026-09-19 client meeting): drag-and-drop reassignment
 * of a programme's college. Net-new — no client frame exists for it yet.
 */
export default async function ProgramsSettingsPage() {
  const colleges = await getProgramsByCollege();

  return (
    <Card className="px-[28px] pt-[19px] pb-[22px]">
      <h1 className="sr-only">Program Management</h1>
      <SectionHeading icon={Building2}>PROGRAM MANAGEMENT</SectionHeading>
      <ProgramManagement colleges={colleges} />
    </Card>
  );
}
