import SettingsShell from "@/components/portal/screens/admin/settings/SettingsShell";
import { CyclesTab, SetupTab } from "@/components/portal/screens/admin/settings/AccreditationTabs";
import { ProgsTab, RepsTab, UsersTab } from "@/components/portal/screens/admin/settings/PeopleTabs";
import { BackupTab, EmailTab, PublicTab, SecurityTab } from "@/components/portal/screens/admin/settings/SystemTabs";
import { requireCurrentUser } from "@/lib/current-user";
import { isSettingsTab } from "@/lib/settings-model";
import {
  getBackupData,
  getCyclesData,
  getEmailData,
  getProgsData,
  getPublicData,
  getRepsData,
  getSecurityData,
  getSetupData,
  getUsersData,
} from "@/lib/settings";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string; rep?: string; pc?: string }> }) {
  const user = await requireCurrentUser();
  const sp = await searchParams;
  const tab = isSettingsTab(sp.tab) ? sp.tab : "cycles";
  const body = await (async () => {
    switch (tab) {
      case "cycles":
        return <CyclesTab data={await getCyclesData()} />;
      case "setup":
        return <SetupTab data={await getSetupData()} />;
      case "users":
        return <UsersTab {...await getUsersData(user.id)} />;
      case "reps":
        return <RepsTab data={await getRepsData()} sel={sp.rep ?? null} />;
      case "progs":
        return <ProgsTab data={await getProgsData()} initialFilter={sp.pc === "none" ? "none" : "all"} />;
      case "public":
        return <PublicTab data={await getPublicData()} />;
      case "email":
        return <EmailTab data={await getEmailData()} />;
      case "backup":
        return <BackupTab data={await getBackupData()} />;
      case "security":
        return <SecurityTab data={await getSecurityData(user.id)} />;
    }
  })();
  return <SettingsShell tab={tab}>{body}</SettingsShell>;
}
