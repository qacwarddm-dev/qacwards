import { redirect } from "next/navigation";
import RepDocuments from "@/components/portal/screens/rep/RepDocuments";
import QacDocuments from "@/components/portal/screens/qac/QacDocuments";
import { getRepDocuments } from "@/lib/rep-documents";
import { getQacDocuments } from "@/lib/qac-documents";
import { requireCurrentUser } from "@/lib/current-user";

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ tab?: string; verify?: string }> }) {
  const user = await requireCurrentUser();
  const { tab, verify } = await searchParams;

  if (user.role === "program_representative") {
    const data = await getRepDocuments(user.id);
    const t = tab === "common" || tab === "reports" ? tab : "templates";
    return <RepDocuments data={data} me={user.name} initialTab={t} />;
  }

  if (user.role !== "qac_personnel" && user.role !== "qac_admin") redirect("/portal/dashboard");
  const t = tab === "common" || tab === "nda" ? tab : verify ? "nda" : "tpl";
  return <QacDocuments data={await getQacDocuments()} initialTab={t} verify={verify ?? null} />;
}
