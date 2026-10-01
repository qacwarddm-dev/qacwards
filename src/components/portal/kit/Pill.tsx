export type PillTone = "ok" | "pend" | "ret" | "miss" | "blue" | "draft" | "py" | "pg" | "pr" | "px" | "pb" | "pm";

const CLS: Record<PillTone, string> = {
  ok: "p-ok",
  pend: "p-pend",
  ret: "p-ret",
  miss: "p-miss",
  blue: "p-blue",
  draft: "p-draft",
  py: "py",
  pg: "pg",
  pr: "pr",
  px: "px",
  pb: "pb",
  pm: "pm",
};

export const pillClass = (tone: PillTone) => `pill ${CLS[tone]}`;

export default function Pill({
  tone,
  children,
  title,
  style,
}: {
  tone: PillTone;
  children: React.ReactNode;
  title?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={`pill ${CLS[tone]}`} title={title} style={style}>
      {children}
    </span>
  );
}

export type DocState = "approved" | "pending" | "returned" | "missing" | "draft";

const DOC: Record<DocState, [string, PillTone]> = {
  approved: ["Approved", "ok"],
  pending: ["For review", "pend"],
  returned: ["Needs revision", "ret"],
  missing: ["Not uploaded", "miss"],
  draft: ["Draft", "draft"],
};

export function DocPill({ state, labels }: { state: DocState; labels?: Partial<Record<DocState, string>> }) {
  const [label, tone] = DOC[state];
  return <Pill tone={tone}>{labels?.[state] ?? label}</Pill>;
}

const DST: Record<Exclude<DocState, "draft">, [string, string]> = {
  approved: ["Approved", "d-ok"],
  pending: ["For your review", "d-rev"],
  returned: ["Returned", "d-ret"],
  missing: ["Not uploaded", "d-miss"],
};

/** The accreditor's dotted status chip. */
export function ReviewChip({ state }: { state: DocState }) {
  const [label, cls] = DST[state === "draft" ? "missing" : state];
  return <span className={`dst ${cls}`}>{label}</span>;
}
