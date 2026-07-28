import Link from "next/link";

type Tone = "yellow" | "maroon" | "outline";
/**
 * `wide` is the role picker's 208x35 r10 button and `pill` the form's 150x40
 * fully-rounded submit, both measured off assets/FIGMA/login. The register steps
 * add two: `pill-sm` is upload-profile's 104x40 Next — the same pill the
 * previous step draws at 150, so it is very likely a design slip rather than
 * intent, kept faithful and flagged — and `upload` is that frame's 191x35 r10
 * outlined "Upload from computer", the only non-filled button in the auth set.
 */
type Size = "wide" | "pill" | "pill-sm" | "upload";

export default function AuthButton({
  tone = "yellow",
  size = "wide",
  href,
  disabled,
  children,
  ...rest
}: {
  tone?: Tone;
  size?: Size;
  /** Renders a link when set, a button otherwise. */
  href?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const fill = {
    yellow: "bg-yellow text-white",
    maroon: "bg-maroon text-white",
    outline: "border-2 border-black bg-white text-black",
  }[tone];

  const box = {
    wide: "h-[35px] w-[208px] rounded-[10px]",
    pill: "h-[40px] w-[150px] rounded-full font-semibold",
    "pill-sm": "h-[40px] w-[104px] rounded-full font-semibold",
    upload: "h-[35px] w-[191px] gap-[10px] rounded-[10px]",
  }[size];

  const look = [
    "flex items-center justify-center text-regular leading-none",
    // The register "Next" ships disabled until the form is filled, and the frame
    // draws that state as maroon at 50% (measured rgb(191,127,127)).
    disabled ? "bg-maroon/50 cursor-not-allowed text-white" : fill,
    box,
  ].join(" ");

  if (href) {
    return (
      <Link href={href} className={look}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" disabled={disabled} className={look} {...rest}>
      {children}
    </button>
  );
}
