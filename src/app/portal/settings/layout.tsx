import { requireCurrentUser } from "@/lib/current-user";
import { notFound } from "next/navigation";
import SettingsTabs from "@/components/portal/screens/SettingsTabs";

/**
 * `/portal/settings` — QAC Admin only (decision 16).
 *
 * The role check here is **not** the access control; RLS is, and every query
 * underneath returns zero rows to anyone else. This exists so the wrong role sees
 * an honest 404 rather than a working page full of empty tables, which is the
 * §B10 rule: a cross-role read is a 404, never a hidden UI element.
 */
export default async function SettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireCurrentUser();
  if (user.role !== "qac_admin") notFound();

  return (
    <div className="px-[81px] pt-[19px] pb-[16px]">
      <SettingsTabs />
      <div className="mt-[18px]">{children}</div>
    </div>
  );
}
