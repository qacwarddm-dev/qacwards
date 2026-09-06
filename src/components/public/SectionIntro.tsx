type Props = {
  /** Two-digit section marker, e.g. "01". Purely typographic — hidden from
   *  assistive tech, which reads the heading itself. */
  index?: string;
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  align?: "start" | "center";
  /** On a maroon band the marker rule flips to gold. */
  onDark?: boolean;
};

/**
 * Section header: an index marker, a rule, a title, an optional standfirst.
 *
 * The marker + hairline is what gives the long editorial pages (About,
 * Campuses) a sense of place; before it, ten `<h2 class="text-title">`s down a
 * 3000px page were indistinguishable from one another.
 *
 * The marker is maroon, never gold: #EFBF04 on white is ~1.9:1 and cannot carry
 * text. Gold is used as a rule or on maroon only.
 */
export function SectionIntro({
  index,
  eyebrow,
  title,
  lede,
  as: Title = "h2",
  align = "start",
  onDark = false,
}: Props) {
  const centred = align === "center";
  return (
    <div className={centred ? "flex flex-col items-center text-center" : ""}>
      {index || eyebrow ? (
        <p
          className={`t-index flex items-center gap-3 ${
            onDark ? "text-yellow" : "text-maroon"
          }`}
        >
          {index ? <span aria-hidden>{index}</span> : null}
          <span
            aria-hidden
            className={`h-px w-8 ${onDark ? "bg-yellow" : "bg-maroon/40"}`}
          />
          {eyebrow ? <span className="uppercase">{eyebrow}</span> : null}
        </p>
      ) : null}

      <Title
        className={`t-section mt-4 font-pup ${
          onDark ? "text-white" : "text-maroon"
        }`}
      >
        {title}
      </Title>

      {lede ? (
        <p
          className={`t-lead mt-4 max-w-[60ch] ${
            onDark ? "text-white/85" : "text-black/70"
          } ${centred ? "mx-auto" : ""}`}
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}
