import { redirect } from "next/navigation";

/** Settings opens on Cycles — the one thing here that gates all the others. */
export default function SettingsIndex() {
  redirect("/portal/settings/cycles");
}
