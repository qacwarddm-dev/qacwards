import type { DocState } from "./Pill";

const RI: Record<DocState, [string, string]> = {
  missing: ["#f3f3f3", "#aaa"],
  approved: ["#e9f7ec", "#1d7a35"],
  returned: ["#fdecec", "#b42323"],
  pending: ["#fff6d6", "#8a6200"],
  draft: ["#f1e8fb", "#6b3fa0"],
};

export default function DocRow({
  state,
  icon,
  title,
  titleExtra,
  sub,
  status,
  actions,
  remark,
  id,
  flash,
  variant,
  onClick,
}: {
  state: DocState;
  icon?: React.ReactNode;
  title: React.ReactNode;
  titleExtra?: React.ReactNode;
  sub: React.ReactNode;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  remark?: { who: string; text: string; mine?: boolean } | null;
  id?: string;
  flash?: boolean;
  variant?: "q3";
  onClick?: () => void;
}) {
  const [bg, fg] = RI[state];
  return (
    <div id={id} className={`req${variant ? ` ${variant}` : ""}${flash ? " flash" : ""}`} onClick={onClick} style={onClick ? { cursor: "pointer" } : undefined}>
      <div className="ri" style={{ background: bg, color: fg }}>
        {icon ?? (state === "missing" ? "—" : "PDF")}
      </div>
      <div>
        <b>{title}</b>
        {titleExtra}
        <small>{sub}</small>
      </div>
      <div className="x2">{status}</div>
      <div className="acts">{actions}</div>
      {remark && (
        <div className={`rem${remark.mine ? " mine" : ""}`}>
          ↺ <b>{remark.who}:</b> {remark.text}
        </div>
      )}
    </div>
  );
}
