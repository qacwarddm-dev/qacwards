export type RepoLoc = "main" | "camp";
export type RepoType = "cert" | "sof" | "tr" | "copcc" | "copce" | "oth";

export const FTYPES: { key: RepoType; name: string; org: "AACCUP" | "CHED" | "PUP"; validity?: boolean }[] = [
  { key: "cert", name: "AACCUP Certificate", org: "AACCUP", validity: true },
  { key: "sof", name: "AACCUP Summary of Findings and Recommendations", org: "AACCUP" },
  { key: "tr", name: "AACCUP Technical Review", org: "AACCUP" },
  { key: "copcc", name: "COPC Certificate", org: "CHED", validity: true },
  { key: "copce", name: "COPC Evaluation", org: "CHED" },
  { key: "oth", name: "Other Files", org: "PUP" },
];

export type RepoUnit = { key: string; name: string; loc: RepoLoc; college?: string; customId?: string };
export type RepoProgram = { id: string; name: string; short: string; unit: string };
export type RepoFile = {
  id: string;
  title: string;
  unit: string;
  loc: RepoLoc;
  type: RepoType;
  programId: string;
  program: string;
  uploadedAt: string;
  by: string;
  from: string | null;
  to: string | null;
  status: string | null;
  levelCode: string | null;
};
export type Repository = { units: RepoUnit[]; programs: RepoProgram[]; files: RepoFile[]; folderIds: Record<RepoType, string> };
