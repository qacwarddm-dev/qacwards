import {
  Calendar,
  ChartLine,
  ClipboardList,
  FileChartColumn,
  FilePenLine,
  FileText,
  Folder,
  History,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  Upload,
} from "lucide-react";

export type PortalRole =
  | "qac_personnel"
  | "qac_admin"
  | "internal_accreditor"
  | "program_representative";

export type PortalNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** The active dashboard icon is drawn solid in the prototype. */
  filled?: boolean;
  /**
   * Override the 29px default. The prototype's icons come from a set with
   * less internal padding than Lucide's, so a glyph that fills its box (the
   * solid dashboard mark) needs a larger size to read at the measured ink.
   */
  size?: number;
};

/**
 * Sidebar items per role, transcribed from each role's own frames.
 *
 * `qac_admin` has no frames of its own — assets/FIGMA/qac_admin/ is empty. Per
 * decision 16 it takes QAC Personnel's navigation plus a Settings section, which
 * is what B3 built. That is stated policy, not a guess about missing artwork.
 *
 * The rail's geometry is identical across roles (60px pitch, icon centred on
 * x=57.5, label at x=87, verified against program_representative/01-Dashboard),
 * so only the items differ.
 */
export const PORTAL_NAV: Partial<Record<PortalRole, PortalNavItem[]>> = {
  qac_personnel: [
    {
      label: "Dashboard",
      href: "/portal/dashboard",
      icon: LayoutDashboard,
      filled: true,
      size: 33,
    },
    { label: "Documents", href: "/portal/documents", icon: Folder },
    { label: "Assignment", href: "/portal/assignment", icon: ClipboardList },
    { label: "Performance", href: "/portal/performance", icon: ChartLine },
    { label: "Reports", href: "/portal/reports", icon: FileChartColumn },
    { label: "Events", href: "/portal/events", icon: Calendar },
  ],

  /** assets/FIGMA/program_representative/01-Dashboard.png — Feedback removed, so
   *  four items where the frame drew five. */
  program_representative: [
    {
      label: "Dashboard",
      href: "/portal/dashboard",
      icon: LayoutDashboard,
      filled: true,
      size: 33,
    },
    { label: "Documents", href: "/portal/documents", icon: FileText },
    { label: "Submission", href: "/portal/submission", icon: Upload },
    { label: "Events", href: "/portal/events", icon: Calendar },
  ],

  /** assets/FIGMA/internal_accreditor/01-Dashboard.png — Feedback removed, so
   *  four items where the frame drew five. */
  internal_accreditor: [
    {
      label: "Dashboard",
      href: "/portal/dashboard",
      icon: LayoutDashboard,
      filled: true,
      size: 33,
    },
    { label: "Assignment", href: "/portal/assignment", icon: ClipboardList },
    { label: "Evaluation", href: "/portal/evaluation", icon: FilePenLine },
    { label: "Events", href: "/portal/events", icon: Calendar },
  ],
};

/**
 * Decision 16: QAC Admin is QAC Personnel's rail plus Settings. Derived rather
 * than copied, so a change to the Personnel nav cannot leave Admin behind.
 *
 * Activity joins it here and *only* here. Decision 17 gives every role their own
 * log, but the three other rails are transcribed from frames that draw four
 * items each — adding a fifth would contradict the artwork the way removing
 * Feedback was meant to match it. Admin has no frames at all, so this rail is
 * the one place a new item is a policy choice rather than a design change; the
 * other roles reach `/portal/activity` from their profile page instead.
 */
PORTAL_NAV.qac_admin = [
  ...(PORTAL_NAV.qac_personnel ?? []),
  { label: "Activity", href: "/portal/activity", icon: History },
  { label: "Settings", href: "/portal/settings", icon: Settings },
];

/**
 * The signed-in person shown in the top bar. Deliberately a *person*, not a
 * role: the bar renders name, position and avatar, so a seam that only carried
 * a role would leave one identity on every screen.
 *
 * Records live in PORTAL_USERS (data.ts, the single backend swap point) and are
 * resolved by getCurrentUser() (src/lib/current-user.ts).
 */
export type PortalUser = {
  role: PortalRole;
  name: string;
  position: string;
  avatar: string;
  notifications: number;
};
