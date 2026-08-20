/**
 * The six AACCUP / COPC repository folders.
 *
 * Unlike everything else in this directory these are not in `OtherContext.txt` —
 * they come from the built portal (`DOCUMENT_FOLDERS` in
 * `src/components/portal/data.ts`), which the plan treats as the specification.
 * Names and order match it exactly so the folder tree keeps working when B6 swaps
 * the constant for a query.
 */
export type RepositoryFolderSeed = {
  slug: string;
  name: string;
  ordinal: number;
};

export const REPOSITORY_FOLDERS: RepositoryFolderSeed[] = [
  { slug: "aaccup-certificate", name: "AACCUP Certificate", ordinal: 1 },
  {
    slug: "aaccup-summary-of-findings-and-recommendation",
    name: "AACCUP Summary of Findings and Recommendation",
    ordinal: 2,
  },
  { slug: "aaccup-technical-review", name: "AACCUP Technical Review", ordinal: 3 },
  {
    slug: "certificate-of-compliance-copc-certificate",
    name: "Certificate of Compliance (COPC) Certificate",
    ordinal: 4,
  },
  {
    slug: "certificate-of-compliance-copc-evaluation",
    name: "Certificate of Compliance (COPC) Evaluation",
    ordinal: 5,
  },
  { slug: "other-files", name: "Other Files", ordinal: 6 },
];
