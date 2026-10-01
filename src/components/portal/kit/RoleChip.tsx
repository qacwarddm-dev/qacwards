import { ROLE_LABEL } from "@/lib/settings-model";

export const roleLabel = (role: string) => (ROLE_LABEL[role] ?? ROLE_LABEL.system)[0];

export default function RoleChip({ role }: { role: string }) {
  const [l, c] = ROLE_LABEL[role] ?? ROLE_LABEL.system;
  return (
    <span className="rch" style={{ color: c, background: `${c}14` }}>
      {l}
    </span>
  );
}
