// Copy across the public pages carries two inline emphasis styles:
//   **text**  bold, body colour
//   __text__  bold accent (statutes, place names)
// Keeping copy in plain strings avoids JSX collapsing the spaces either side of
// an inline <strong>. Lifted out of the campuses page the moment a second page
// needed it.
const EMPHASIS = /(\*\*[^*]+\*\*|__[^_]+__)/g;

/**
 * `onDark` is not cosmetic: the accent emphasis is maroon, and the campuses
 * intro now sits on a maroon band, where maroon-on-maroon is invisible. On dark
 * the accent flips to gold — the only pairing in the token set with enough
 * separation from the field behind it.
 */
export function RichText({
  text,
  onDark = false,
}: {
  text: string;
  onDark?: boolean;
}) {
  const accent = onDark ? "text-yellow" : "text-maroon";
  return (
    <>
      {text.split(EMPHASIS).map((part, index) => {
        if (part.startsWith("**")) {
          return (
            <strong key={index} className="font-bold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("__")) {
          return (
            <strong key={index} className={`font-bold ${accent}`}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      })}
    </>
  );
}
