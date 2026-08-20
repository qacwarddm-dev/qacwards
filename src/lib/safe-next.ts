/**
 * Sanitise a `?next=` value before redirecting to it.
 *
 * An open redirect is one `?next=https://evil.example` away: the login page would
 * happily bounce a freshly authenticated user onto an attacker's site, and the
 * URL bar would show they arrived from us. Only same-origin *paths* pass, and
 * only ones inside `/portal`, so the parameter cannot drive anyone anywhere else
 * either.
 *
 * `new URL(value, base)` normalises away the tricks — protocol-relative
 * `//evil.example`, backslashes, encoded schemes, `https:/\/\evil.example` — before
 * the check runs, which is why this parses rather than pattern-matches.
 *
 * Its own module, not `middleware.ts`, because the login form is a client
 * component: importing it from the middleware would pull `@supabase/ssr`'s server
 * client into the browser bundle.
 */
const FALLBACK = "/portal/dashboard";
const BASE = "http://safe-next.invalid";

export function safeNextParam(value: string | null | undefined): string {
  if (!value) return FALLBACK;

  let url: URL;
  try {
    url = new URL(value, BASE);
  } catch {
    return FALLBACK;
  }

  // Anything that resolved elsewhere was absolute or protocol-relative.
  if (url.origin !== BASE) return FALLBACK;
  if (!url.pathname.startsWith("/portal/")) return FALLBACK;

  return url.pathname + url.search;
}
