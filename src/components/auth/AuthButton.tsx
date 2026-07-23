import Link from "next/link";

type Tone = "yellow" | "maroon";
/** `wide` is the role picker's 208x35 r10 button; `pill` is the form's 150x40
 *  fully-rounded submit. Both measured off assets/FIGMA/login. */
type Size = "wide" | "pill";

export default function AuthButton({
  tone = "yellow",
  size = "wide",
  href,
  children,
  ...rest
}: {
  tone?: Tone;
  size?: Size;
  /** Renders a link when set, a button otherwise. */
  href?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const look = [
    "flex items-center justify-center text-regular leading-none text-white",
    tone === "yellow" ? "bg-yellow" : "bg-maroon",
    size === "wide"
      ? "h-[35px] w-[208px] rounded-[10px]"
      : "h-[40px] w-[150px] rounded-full font-semibold",
  ].join(" ");

  if (href) {
    return (
      <Link href={href} className={look}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={look} {...rest}>
      {children}
    </button>
  );
}
