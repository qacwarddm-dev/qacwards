/**
 * Portal component kit. Anything appearing on more than one screen lives here —
 * see the "Component kit" rule in CLAUDE.md. Screens pass data and variants;
 * components own their own spacing, radius, colour and type.
 */
export { default as BackLink } from "./BackLink";
export { default as Breadcrumb, type Crumb } from "./Breadcrumb";
export { default as Button } from "./Button";
export { default as Card } from "./Card";
export { default as CardTitleBar } from "./CardTitleBar";
export { default as CoverCard } from "./CoverCard";
export { default as DataTable, type Column, type Row } from "./DataTable";
export { default as DocCard } from "./DocCard";
export { default as DocTabs, type DocTab } from "./DocTabs";
export { default as DocumentBrowser } from "./DocumentBrowser";
export { default as EmptyState } from "./EmptyState";
export {
  FieldLabel,
  PasswordInput,
  ReadOnlyField,
  ReadOnlyValue,
  SelectInput,
  TextInput,
} from "./Field";
export { default as FileCard } from "./FileCard";
export { default as FolderCard } from "./FolderCard";
export { default as FolderGrid, type FolderEntry } from "./FolderGrid";
export { default as MiniCalendar, type MeetingKind } from "./MiniCalendar";
export {
  CalendarLegend,
  default as MonthCalendar,
  type DayMark,
} from "./MonthCalendar";
export { default as Panel } from "./Panel";
export { default as PanelHeader } from "./PanelHeader";
export { default as PdfChip } from "./PdfChip";
export { default as ProgressRow } from "./ProgressRow";
export { default as RowList } from "./RowList";
export { default as SearchField } from "./SearchField";
export { default as SectionHeading } from "./SectionHeading";
export { default as SplitStat, type SplitStatHalf } from "./SplitStat";
export { default as StatCard, StatRow, type Stat } from "./StatCard";
export { default as StatusBarChart, type StatusBar } from "./StatusBarChart";
export { default as StatusPill, type DocStatus } from "./StatusPill";
export { default as Stepper, type Step } from "./Stepper";
export { default as UploadList, type Upload } from "./UploadList";
export { default as ViewToggle, type BrowserView } from "./ViewToggle";
