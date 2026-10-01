export default function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  label?: React.ReactNode;
}) {
  return (
    <label className="tgl">
      <input type="checkbox" checked={checked} onChange={(e) => onChange?.(e.target.checked)} />
      <span />
      {label}
    </label>
  );
}
