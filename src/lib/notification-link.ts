import type { PortalRole } from "@/components/portal/portal-nav";

const EVALUATION = /^\/portal\/evaluation\/([0-9a-f-]{36})$/i;

export function notificationHref(role: PortalRole, link: string | undefined): string | undefined {
  if (!link) return link;
  const url = new URL(link, "http://local");
  const qac = role === "qac_admin" || role === "qac_personnel";

  if (url.pathname === "/portal/submission" && role !== "program_representative") {
    if (qac) return `/portal/assignment${url.search}`;
    return role === "internal_accreditor" ? "/portal/evaluation" : link;
  }
  if (url.pathname === "/portal/dashboard" && url.searchParams.get("uploads") && qac) return "/portal/extension-monitoring";

  const evaluation = EVALUATION.exec(url.pathname);
  if (evaluation) return `/portal/evaluation?a=${evaluation[1]}`;
  return link;
}
