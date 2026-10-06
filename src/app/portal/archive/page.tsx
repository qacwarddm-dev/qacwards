import { redirect } from "next/navigation";
import ArchiveBrowser from "@/components/portal/kit/ArchiveBrowser";
import { requireCurrentUser } from "@/lib/current-user";
import { getArchive, getArchiveDetail } from "@/lib/archive";

export default async function ArchivePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const user = await requireCurrentUser();
  const own = user.role === "program_representative";
  if (!own && user.role !== "qac_personnel" && user.role !== "qac_admin") redirect("/portal/dashboard");
  const sp = await searchParams;
  const entries = await getArchive();
  const selected = sp.id && entries.some((e) => e.id === sp.id) ? sp.id : null;
  const detail = selected ? await getArchiveDetail(selected) : null;
  return <ArchiveBrowser entries={entries} selectedId={selected} detail={detail} viewer={user.name} own={own} />;
}
