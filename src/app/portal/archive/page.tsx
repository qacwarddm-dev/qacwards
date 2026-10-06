import { redirect } from "next/navigation";
import ArchiveBrowser from "@/components/portal/kit/ArchiveBrowser";
import { requireCurrentUser } from "@/lib/current-user";
import { getArchive, getArchiveCycles, getArchiveDetail } from "@/lib/archive";

export default async function ArchivePage({ searchParams }: { searchParams: Promise<{ id?: string; cycle?: string }> }) {
  const user = await requireCurrentUser();
  const own = user.role === "program_representative";
  if (!own && user.role !== "qac_personnel" && user.role !== "qac_admin") redirect("/portal/dashboard");
  const sp = await searchParams;
  const entries = await getArchive();
  const all = await getArchiveCycles(entries);
  const cycles = own ? all.filter((c) => c.programs > 0) : all;
  const selected = sp.id && entries.some((e) => e.id === sp.id) ? sp.id : null;
  const cycleId = sp.cycle && cycles.some((c) => c.id === sp.cycle) ? sp.cycle : null;
  const detail = selected ? await getArchiveDetail(selected) : null;
  return <ArchiveBrowser entries={entries} cycles={cycles} cycleId={cycleId} selectedId={selected} detail={detail} viewer={user.name} own={own} />;
}
