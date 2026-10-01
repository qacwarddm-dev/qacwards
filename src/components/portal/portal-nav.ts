import type { IconName } from "./kit/Icon";

export type PortalRole =
  | "qac_personnel"
  | "qac_admin"
  | "internal_accreditor"
  | "program_representative";

export type NavBadge = "assign" | "resub" | "fb" | "acc" | "ext";

export type PortalNavItem = {
  label: string;
  href: string;
  icon: IconName;
  badge?: NavBadge;
  newTag?: boolean;
};

export type NavGroup = { title: string; items: PortalNavItem[] };

export type PortalNav = { groups: NavGroup[]; help?: PortalNavItem };

const DASH: PortalNavItem = { label: "Dashboard", href: "/portal/dashboard", icon: "dash" };
const EVENTS: PortalNavItem = { label: "Events", href: "/portal/events", icon: "events" };
const HELP: PortalNavItem = { label: "Help & User Guide", href: "/portal/help", icon: "help" };

const QAC_NAV: NavGroup[] = [
  {
    title: "WORK",
    items: [
      DASH,
      { label: "Accreditation", href: "/portal/assignment", icon: "cap", badge: "acc" },
      { label: "Extension Monitoring", href: "/portal/extension-monitoring", icon: "ext", badge: "ext" },
    ],
  },
  {
    title: "LIBRARY",
    items: [
      { label: "AACCUP & COPC", href: "/portal/aaccup-copc", icon: "folder" },
      { label: "Documents", href: "/portal/documents", icon: "docs" },
      { label: "Reports", href: "/portal/reports", icon: "report" },
      { label: "Feedback", href: "/portal/feedback", icon: "star" },
      { label: "Recently Deleted", href: "/portal/recently-deleted", icon: "trash" },
    ],
  },
  { title: "SCHEDULE", items: [EVENTS] },
];

export const PORTAL_NAV: Record<PortalRole, PortalNav> = {
  internal_accreditor: {
    groups: [
      {
        title: "WORK",
        items: [
          DASH,
          { label: "Assignment", href: "/portal/assignment", icon: "assign", badge: "assign" },
          { label: "Accreditation", href: "/portal/evaluation", icon: "cap" },
          { label: "Resubmissions", href: "/portal/resubmissions", icon: "resub", badge: "resub", newTag: true },
        ],
      },
      { title: "SCHEDULE", items: [EVENTS] },
    ],
    help: HELP,
  },
  program_representative: {
    groups: [
      {
        title: "WORK",
        items: [
          DASH,
          { label: "Accreditation", href: "/portal/submission", icon: "cap" },
          { label: "Feedback", href: "/portal/feedback", icon: "chat", badge: "fb" },
        ],
      },
      { title: "LIBRARY", items: [{ label: "Documents", href: "/portal/documents", icon: "docs" }] },
      { title: "SCHEDULE", items: [EVENTS] },
    ],
    help: HELP,
  },
  qac_personnel: { groups: QAC_NAV },
  qac_admin: {
    groups: [
      ...QAC_NAV,
      {
        title: "ADMIN",
        items: [
          { label: "Activity", href: "/portal/activity", icon: "activity" },
          { label: "Settings", href: "/portal/settings", icon: "settings" },
        ],
      },
    ],
  },
};

export type PortalUser = {
  role: PortalRole;
  name: string;
  position: string;
  avatar: string;
  notifications: number;
  actsAsAccreditor?: boolean;
};

/** A QAC account the Admin also made an Internal Accreditor ("acting IA") gets
 *  the accreditor's evaluation screen as its own group. */
export function navForUser(user: PortalUser): PortalNav {
  const nav = PORTAL_NAV[user.role];
  if (!user.actsAsAccreditor || user.role === "internal_accreditor") return nav;
  return {
    ...nav,
    groups: [
      ...nav.groups.slice(0, 1),
      {
        title: "AS ACCREDITOR",
        items: [{ label: "My Evaluations", href: "/portal/evaluation", icon: "assign" }],
      },
      ...nav.groups.slice(1),
    ],
  };
}

export function flatNav(nav: PortalNav): PortalNavItem[] {
  return [...nav.groups.flatMap((g) => g.items), ...(nav.help ? [nav.help] : [])];
}
