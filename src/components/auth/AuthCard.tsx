/**
 * The surface card sitting in the auth panel. 382px wide with a 20px radius on
 * both login frames, centred in the 518px panel; fill is the surface token
 * rather than white because the panel behind it already is white.
 *
 * The two frames differ only in where the card starts and how it is padded —
 * `picker` sits 84px below the panel top and centres its own contents, `form`
 * sits 58.5px below the Back link and hands its body to a white sub-card.
 */
export default function AuthCard({
  variant = "picker",
  children,
}: {
  variant?: "picker" | "form";
  children: React.ReactNode;
}) {
  const pad =
    variant === "picker"
      ? "mt-[84px] items-center pt-[41.5px] pb-[71px]"
      : "mt-[58.5px] px-[2px] pt-[23.75px]";

  return (
    <div
      className={`flex w-[382px] max-w-[calc(100%-32px)] flex-col rounded-[20px] bg-surface shadow-card ${pad}`}
    >
      {children}
    </div>
  );
}
