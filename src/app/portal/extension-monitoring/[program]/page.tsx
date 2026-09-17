import { notFound } from "next/navigation";
import ExtensionMonitoringDetail from "@/components/portal/screens/ExtensionMonitoringDetail";
import { getExtensionProgram } from "@/lib/extension-monitoring";

export default async function ExtensionMonitoringDetailPage({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const { program: programId } = await params;
  const program = await getExtensionProgram(programId);
  if (!program) notFound();

  return <ExtensionMonitoringDetail program={program} />;
}
