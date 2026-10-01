export type SettingsTab = "cycles" | "setup" | "users" | "reps" | "progs" | "public" | "email" | "backup" | "security";

export const STABS: [string, [SettingsTab, string, string][]][] = [
  [
    "ACCREDITATION",
    [
      ["cycles", "Accreditation Cycles", "🗓"],
      ["setup", "Accreditation Setup", "🧩"],
    ],
  ],
  [
    "PEOPLE & PROGRAMS",
    [
      ["users", "Users", "👤"],
      ["reps", "Program Representatives", "🎓"],
      ["progs", "Program Management", "🏛"],
    ],
  ],
  [
    "SYSTEM",
    [
      ["public", "Public Information", "🌐"],
      ["email", "Email & Notifications", "✉"],
      ["backup", "Backup & Restore", "💾"],
      ["security", "Security", "🔒"],
    ],
  ],
];

export const isSettingsTab = (t: unknown): t is SettingsTab => STABS.some(([, L]) => L.some(([k]) => k === t));

export type Rules = { minReadiness: number; perProgram: number; acceptDays: number; scale: string; formCode: string };
export type PublicInfo = {
  live: boolean;
  dir: boolean;
  lv: boolean;
  val: boolean;
  camp: boolean;
  hidden: string[];
  email: string;
  phone: string;
  room: string;
  hrs: string;
  about: string;
  forms: { nda: boolean; tpl: boolean; guide: boolean };
  publishedAt?: string;
  publishedBy?: string;
};
export type Security = { maint: boolean; mmsg: string; dom: string; tfa: boolean; pw: number; sess: number; att: number; lock: number; watermark: boolean };
export type BackupPrefs = { auto: boolean; time: string; keep: number; files: boolean; offsite: boolean; mailFail: boolean };
export type NotifyPrefs = Record<string, boolean>;

export const DEFAULTS = {
  rules: { minReadiness: 10, perProgram: 2, acceptDays: 3, scale: "1–5 (Poor to Excellent)", formCode: "QAC-TPL-01" } as Rules,
  public: {
    live: true,
    dir: true,
    lv: true,
    val: true,
    camp: true,
    hidden: [],
    email: "qac@pup.edu.ph",
    phone: "",
    room: "",
    hrs: "Mon–Fri, 8:00 AM – 5:00 PM",
    about: "The Quality Assurance Center leads program accreditation (AACCUP) and compliance (CHED COPC) across all PUP campuses.",
    forms: { nda: true, tpl: true, guide: true },
  } as PublicInfo,
  security: { maint: false, mmsg: "QAC-WARDS is under scheduled maintenance. Please come back later.", dom: "@pup.edu.ph", tfa: false, pw: 10, sess: 30, att: 5, lock: 15, watermark: true } as Security,
  backup: { auto: true, time: "02:00", keep: 30, files: true, offsite: false, mailFail: true } as BackupPrefs,
  notify: {} as NotifyPrefs,
};

export type SettingKey = keyof typeof DEFAULTS;

export const NOTIFY_ROWS: [string, string, string][] = [
  ["returned", "Document returned for revision", "Program rep"],
  ["upload", "New upload waiting for review", "QAC · accreditors"],
  ["assignment", "Assignment created", "Accreditors"],
  ["deadline", "Deadline in 3 days", "Program rep"],
  ["expiring", "Accreditation expires in 6 months", "Program rep · QAC"],
  ["signed", "Evaluation report signed", "QAC"],
];

export const ROLE_LABEL: Record<string, [string, string]> = {
  qac_admin: ["QAC Admin", "#800000"],
  qac_personnel: ["QAC Personnel", "#1f4fa3"],
  internal_accreditor: ["Internal Accreditor", "#6b3fa0"],
  program_representative: ["Academic Program", "#1d7a35"],
  system: ["System account", "#666"],
};
