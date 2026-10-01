import Link from "next/link";
import { BackIcon } from "./Icon";

export default function BackLink({ to, href, onClick }: { to: string; href?: string; onClick?: () => void }) {
  const inner = (
    <>
      <BackIcon />
      <span>
        Back to <b>{to}</b>
      </span>
    </>
  );
  if (href)
    return (
      <Link className="pback" href={href}>
        {inner}
      </Link>
    );
  return (
    <a className="pback" role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => e.key === "Enter" && onClick?.()}>
      {inner}
    </a>
  );
}
