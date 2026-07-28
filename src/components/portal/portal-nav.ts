import {
  Calendar,
  ChartLine,
  ClipboardList,
  FileChartColumn,
  FilePenLine,
  FileText,
  Folder,
  LayoutDashboard,
  type LucideIcon,
  Star,
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
 * Sidebar items per role, transcribed from each role's own frames. A role with
 * no entry here renders an empty rail on purpose — `internal_accreditor` and
 * `qac_admin` are not guessed.
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
    { label: "Feedback", href: "/portal/feedback", icon: Star },
    { label: "Events", href: "/portal/events", icon: Calendar },
  ],

  /** assets/FIGMA/program_representative/01-Dashboard.png — five items. */
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
    { label: "Feedback", href: "/portal/feedback", icon: Star },
    { label: "Events", href: "/portal/events", icon: Calendar },
  ],

  /** assets/FIGMA/internal_accreditor/01-Dashboard.png — five items. */
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
    { label: "Feedback", href: "/portal/feedback", icon: Star },
    { label: "Events", href: "/portal/events", icon: Calendar },
  ],
};

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
