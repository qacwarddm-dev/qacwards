import {
  Calendar,
  ChartLine,
  ClipboardList,
  FileChartColumn,
  Folder,
  LayoutDashboard,
  type LucideIcon,
  Star,
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
 * Sidebar items per role. Only qac_personnel is built so far — its frames are
 * in assets/FIGMA/qac_personnel; the other three folders are still empty, so
 * their nav is deliberately absent rather than guessed.
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
};

/**
 * Signed-in user shown in the top bar. Placeholder copy straight from the
 * prototype — swap point when Supabase Auth lands (plans/03-auth-role-gate.md).
 */
export const CURRENT_USER = {
  role: "qac_personnel" as PortalRole,
  name: "Surname, Given Name M.I.",
  position: "Position",
  avatar: "/assets/portal/avatar-placeholder.png",
  notifications: 1,
};
