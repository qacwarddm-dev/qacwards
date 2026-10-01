import Icon from "./Icon";

export default function SearchBox({
  value,
  onChange,
  placeholder,
  variant = "r",
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  variant?: "r" | "r-sm" | "pill";
  style?: React.CSSProperties;
}) {
  if (variant === "pill")
    return (
      <div className="search" style={style}>
        <span aria-hidden>⌕</span>
        <input value={value} placeholder={placeholder} aria-label={placeholder} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  return (
    <div className={variant === "r-sm" ? "rsearch sm3" : "rsearch"} style={style}>
      <span style={{ color: "#666", display: "flex" }}>
        <Icon name="search" size={16} stroke={2} />
      </span>
      <input value={value} placeholder={placeholder} aria-label={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
