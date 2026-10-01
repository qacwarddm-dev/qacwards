import Link from "next/link";
import { MiniRing } from "./Spinner";

export type BtnVariant = "s" | "o" | "g" | "d" | "gh" | "gn" | "danger" | "plain";

type Common = {
  variant?: BtnVariant;
  sm?: boolean;
  className?: string;
  children: React.ReactNode;
  title?: string;
};

type AsButton = Common & {
  href?: undefined;
  download?: undefined;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: React.ReactNode;
  type?: "button" | "submit";
  form?: string;
};

type AsLink = Common & {
  href: string;
  download?: string | boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  external?: boolean;
};

function cls(variant: BtnVariant, sm?: boolean, extra?: string, loading?: boolean) {
  const v = variant === "plain" ? "" : `b${variant}`;
  return ["btn", v, sm ? "sm" : "", loading ? "q-btn-loading" : "", extra ?? ""].filter(Boolean).join(" ");
}

export default function Btn(props: AsButton | AsLink) {
  const { variant = "s", sm, className, children, title } = props;
  const loading = props.href === undefined && props.loading;
  const c = cls(variant, sm, className, loading);
  if (props.href !== undefined) {
    if (props.download !== undefined || props.external || props.href.startsWith("mailto:") || props.href.startsWith("data:")) {
      return (
        <a className={c} href={props.href} download={props.download} onClick={props.onClick} title={title} target={props.external && !props.href.startsWith("mailto:") ? "_blank" : undefined} rel={props.external ? "noreferrer" : undefined}>
          {children}
        </a>
      );
    }
    return (
      <Link className={c} href={props.href} onClick={props.onClick} title={title}>
        {children}
      </Link>
    );
  }
  return (
    <button type={props.type ?? "button"} form={props.form} className={c} onClick={props.onClick} disabled={props.disabled || loading} aria-busy={loading || undefined} title={title}>
      {loading && <MiniRing />}
      {loading && props.loadingLabel !== undefined ? props.loadingLabel : children}
    </button>
  );
}
