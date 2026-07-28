export type MeetingKind = "psv" | "copc";

const DOT: Record<MeetingKind, string> = {
  psv: "bg-yellow",
  copc: "bg-maroon",
};

const DOT_LABEL: Record<MeetingKind, string> = {
  psv: "PSV Meetings",
  copc: "COPC Meetings",
};

/** Monday-first, and the frame abbreviates Thursday to two letters. */
const WEEKDAYS = ["M", "T", "W", "TH", "F", "S", "S"];

export type MiniCalendarProps = {
  /** Any day inside the month to draw. Only the month name is shown. */
  month: Date;
  /** Day-of-month drawn in a filled grey circle. Earlier days are dimmed. */
  today?: number;
  /** Meeting marks keyed by day-of-month; drawn as a filled circle. */
  marks?: Record<number, MeetingKind>;
};

/**
 * Compact month grid for the dashboard — a different component from
 * `MonthCalendar`, which is the full-width Events grid (785px, yellow header,
 * 70px cells). This one is the 450x294 maroon-outlined card on
 * program_representative/01-Dashboard.png: seven 58px columns inset 22px, five
 * 32px rows, and a two-item legend.
 *
 * Days before `today` render dimmed. That is the rule the frame implies — it
 * draws "1" grey while 2..7 are black, with 2 circled as today.
 */
export default function MiniCalendar({ month, today, marks = {} }: MiniCalendarProps) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const daysInPrev = new Date(year, m, 0).getDate();
  // getDay() is Sunday-first; this grid is Monday-first.
  const lead = (new Date(year, m, 1).getDay() + 6) % 7;

  const cells: { day: number; inMonth: boolean }[] = [];
  for (let i = lead - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, inMonth: false });
  for (let dd = 1; dd <= daysInMonth; dd++) cells.push({ day: dd, inMonth: true });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - lead - daysInMonth + 1, inMonth: false });

  return (
    <div className="flex h-[294px] w-[450px] flex-col rounded-[20px] border border-maroon bg-white px-[20px] pt-[25px]">
      <h3 className="text-subheading font-semibold leading-none text-black">
        {month.toLocaleDateString("en-US", { month: "long" })}
      </h3>

      {/* Grid is inset 22 from the card, i.e. 2 further than the title. */}
      <div className="mt-[18px] grid grid-cols-7 px-[2px] text-center text-subheading leading-none text-gray">
        {WEEKDAYS.map((w, i) => (
          <span key={`${w}-${i}`}>{w}</span>
        ))}
      </div>

      <div className="mt-[4px] grid grid-cols-7 px-[2px]">
        {cells.map((c, i) => {
          const isToday = c.inMonth && today !== undefined && c.day === today;
          const mark = c.inMonth ? marks[c.day] : undefined;
          const dim = !c.inMonth || (today !== undefined && c.day < today);

          return (
            <span
              key={`${c.day}-${i}`}
              className="flex h-[32px] items-center justify-center"
            >
              <span
                className={`flex h-[22px] w-[22px] items-center justify-center rounded-full text-subheading leading-none ${
                  isToday ? "bg-gray text-white" : mark ? `${DOT[mark]} text-black` : ""
                } ${dim && !isToday ? "text-[color:var(--color-gray)]/50" : ""}`}
              >
                {c.day}
              </span>
            </span>
          );
        })}
      </div>

      {/* Legend ink spans 224.5px centred in the card; that lands the labels on
          12px, not the 15px the day grid uses. */}
      <div className="mt-auto flex items-center justify-center gap-[26px] pb-[28px]">
        {(Object.keys(DOT) as MeetingKind[]).map((k) => (
          <span key={k} className="flex items-center gap-[9px]">
            <span className={`h-[11px] w-[11px] rounded-full ${DOT[k]}`} />
            <span className="text-regular leading-none text-black">
              {DOT_LABEL[k]}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
