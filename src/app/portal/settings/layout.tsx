import { notFound } from "next/navigation";
import { requireCurrentUser } from "@/lib/current-user";

export default async function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireCurrentUser();
  if (user.role !== "qac_admin") notFound();
  return children;
}
