/**
 * The dev-preview cookie name, in its own module so it can be imported from
 * both server code (`current-user.ts`, the dev-switch route) and client code
 * (the login form) — `current-user.ts` itself pulls in `next/headers` and so
 * must never be imported into a client component.
 *
 * Dev-only. Set by /portal/dev/switch and the login demo shortcut, read by
 * getCurrentUser(), ignored everywhere else. Gone with the seam in phase 3b.
 */
export const DEV_USER_COOKIE = "qac_dev_user";
