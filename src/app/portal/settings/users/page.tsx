import { IdCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUser } from "@/lib/current-user";
import { Card, SectionHeading } from "@/components/portal/kit";
import UserAdmin from "@/components/portal/screens/UserAdmin";

/**
 * Activate, deactivate and change a user's role (UC-019).
 *
 * Deactivation is the reason `is_active` is checked in middleware *and* in every
 * RLS policy: flipping it here must lock the person out on their very next
 * request, not at their next login.
 */
export default async function UsersSettingsPage() {
  const me = await requireCurrentUser();
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, surname, given_name, webmail, role, is_active")
    .order("surname");

  return (
    <Card className="px-[28px] pt-[19px] pb-[22px]">
      <h1 className="sr-only">User Administration</h1>
      <SectionHeading icon={IdCard}>USERS</SectionHeading>
      <UserAdmin
        currentUserId={me.id}
        users={(users ?? []).map((u) => ({
          id: u.id,
          name: `${u.surname}, ${u.given_name}`,
          webmail: u.webmail,
          role: u.role,
          isActive: u.is_active,
        }))}
      />
    </Card>
  );
}
