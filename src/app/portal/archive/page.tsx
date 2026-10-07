import { redirect } from "next/navigation";
import ArchiveBrowser from "@/components/portal/kit/ArchiveBrowser";
import { requireCurrentUser } from "@/lib/current-user";
import { getArchive, getArchiveCycles, getArchiveDetail, getCycleContents } from "@/lib/archive";

export default async function ArchivePage({ searchParams }: { searchParams: Promise<{ id?: string; cycle?: string; program?: string }> }) {
  const user = await requireCurrentUser();
  const own = user.role === "program_representative";
  if (!own && user.role !== "qac_personnel" && user.role !== "qac_admin") redirect("/portal/dashboard");
  const sp = await searchParams;
  const entries = await getArchive();
  const all = await getArchiveCycles(entries);
  const cycles = own ? all.filter((c) => c.programs > 0) : all;
  const selected = sp.id && entries.some((e) => e.id === sp.id) ? sp.id : null;
  const cycle = sp.cycle ? (cycles.find((c) => c.id === sp.cycle) ?? null) : null;
  const [detail, one] = await Promise.all([selected ? getArchiveDetail(selected) : null, cycle && !selected && sp.program ? getCycleContents(cycle, entries, sp.program) : null]);
  const contents = !cycle || selected ? null : one?.programs.length ? one : await getCycleContents(cycle, entries);
  const programId = cycle && sp.program && (selected || one?.programs.length) ? sp.program : null;
  return <ArchiveBrowser entries={entries} cycles={cycles} cycleId={cycle?.id ?? null} programId={programId} contents={contents} selectedId={selected} detail={detail} viewer={user.name} own={own} />;
}
