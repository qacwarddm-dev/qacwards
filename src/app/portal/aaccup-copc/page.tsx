import { redirect } from "next/navigation";
import QacCopc from "@/components/portal/screens/qac/QacCopc";
import { requireCurrentUser } from "@/lib/current-user";
import { getRepository, FTYPES, type RepoLoc, type RepoType } from "@/lib/repository";
import { manilaDay } from "@/lib/program-names";

export default async function AaccupCopcPage({ searchParams }: { searchParams: Promise<{ loc?: string; unit?: string; type?: string }> }) {
  const user = await requireCurrentUser();
  if (user.role !== "qac_personnel" && user.role !== "qac_admin") redirect("/portal/documents?tab=reports");
  const sp = await searchParams;
  const loc: RepoLoc | null = sp.loc === "main" || sp.loc === "camp" ? sp.loc : null;
  const type = FTYPES.some((t) => t.key === sp.type) ? (sp.type as RepoType) : null;
  const repo = await getRepository();
  const unit = loc && sp.unit && repo.units.some((u) => u.key === sp.unit && u.loc === loc) ? sp.unit : null;
  return <QacCopc repo={repo} nav={{ loc, unit, type: unit ? type : null }} today={manilaDay()} />;
}
