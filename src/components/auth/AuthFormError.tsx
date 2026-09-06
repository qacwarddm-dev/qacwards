import { CircleAlert, CircleCheck, Info } from "lucide-react";

/**
 * Form-level message on an auth screen — the failed sign-in, the expired reset
 * link, the "check your inbox" confirmation.
 *
 * New in the 2026-08-21 pass. Every form previously rendered its own bare
 * `<p className="text-regular text-maroon">`: seven near-identical copies, none
 * of them announced. A message that appears after a submit and is not inside a
 * live region is invisible to a screen reader — the user presses Log in, nothing
 * is read out, and the only signal that anything happened is that focus stayed
 * put. `role="alert"` fixes that, and the icon means the message is not carrying
 * its meaning in maroon alone (WCAG 1.4.1).
 *
 * `notice` is deliberately not green-for-success: on this flow the "success"
 * states are instructions to go and do something in your inbox, so they read as
 * information, not completion. `success` exists for the one case that really is
 * an ending.
 */
const TONES = {
  error: {
    Icon: CircleAlert,
    box: "border-maroon/30 bg-[var(--tint-maroon)] text-maroon",
    live: "assertive" as const,
  },
  notice: {
    Icon: Info,
    box: "border-[var(--hairline-strong)] bg-surface text-black",
    live: "polite" as const,
  },
  success: {
    Icon: CircleCheck,
    box: "border-approved/30 bg-[var(--tint-approved)] text-black",
    live: "polite" as const,
  },
};

export default function AuthFormError({
  children,
  tone = "error",
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES;
}) {
  const { Icon, box, live } = TONES[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={live}
      className={`flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border p-[var(--space-3)] ${box}`}
    >
      <Icon className="mt-[1px] h-[16px] w-[16px] shrink-0" strokeWidth={2} aria-hidden />
      <p className="t-sm min-w-0 flex-1 text-pretty">{children}</p>
    </div>
  );
}
