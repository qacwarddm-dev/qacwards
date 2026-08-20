import { redirect } from "next/navigation";
import QacPersonnelCreateAssignment from "@/components/portal/screens/QacPersonnelCreateAssignment";
import { requireCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";

/**
 * `/portal/assignment/new` — the create form the QAC Personnel Assignment "New"
 * button opens (qac_personnel/03.1-Create new assignment). Only QAC Personnel
 * create assignments; any other role that lands here is bounced to the list.
 *
 * The campus/department/programme picker is loaded once here and filtered
 * client-side (same reasoning as `RepMapper`'s programme search) — eligible
 * accreditors are the one selection-dependent piece and are fetched by a
 * server action as the programme choice changes.
 */
export default async function NewAssignmentPage() {
  const user = await requireCurrentUser();

  if (user.role !== "qac_personnel") redirect("/portal/assignment");

  const supabase = await createClient();

  const [{ data: campuses }, { data: colleges }, { data: programs }, { data: levels }] =
    await Promise.all([
      supabase.from("campuses").select("id, name").order("name"),
      supabase.from("colleges").select("id, name").order("name"),
      supabase.from("programs").select("id, name, campus_id, college_id").order("name").limit(1000),
      supabase
        .from("accreditation_levels")
        .select("id, code, name")
        .in("code", ["I", "II", "III", "IV"])
        .order("ordinal"),
    ]);

  return (
    <>
      <h1 className="sr-only">New Assignment</h1>
      <QacPersonnelCreateAssignment
        campuses={campuses ?? []}
        colleges={colleges ?? []}
        programs={(programs ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          campusId: p.campus_id,
          collegeId: p.college_id,
        }))}
        levels={levels ?? []}
      />
    </>
  );
}
