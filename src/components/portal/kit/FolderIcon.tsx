import { COLLEGE_COLOR } from "./calendar";

const LOGO = { AACCUP: "/assets/portal/mockup/logo-aaccup.png", CHED: "/assets/portal/mockup/logo-ched.png", PUP: "/assets/portal/mockup/logo-qac.png" };

/** The yellow folder with an organisation logo or a college code badge on it. */
export default function FolderIcon({ org, college, seal }: { org?: keyof typeof LOGO; college?: string; seal?: boolean }) {
  return (
    <div className="fsv">
      <svg viewBox="0 0 120 88" aria-hidden>
        <path d="M18 22V10a7 7 0 0 1 7-7h26a7 7 0 0 1 5 2l5 5h34a7 7 0 0 1 7 7v5z" fill="#e2b000" />
        <rect x="2" y="20" width="116" height="66" rx="12" fill="#f2c200" />
        <rect x="2" y="20" width="116" height="10" rx="5" fill="#f7cf26" opacity=".6" />
      </svg>
      {org && <img src={LOGO[org]} alt={`${org} logo`} />}
      {seal && <img src="/assets/portal/mockup/seal.png" alt="" />}
      {college && (
        <span className="fbadge" style={{ background: COLLEGE_COLOR[college] ?? "#800000" }}>
          {college}
        </span>
      )}
    </div>
  );
}
