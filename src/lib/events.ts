
/** Converts a `datetime-local` wall-clock string (no zone) into a UTC ISO
 *  instant, hard-pinned to Manila's fixed UTC+8 (no DST, ever) rather than
 *  whatever zone the server process happens to run in (O-20). */
export function manilaWallClockToUtcIso(wallClock: string): string {
  const withSeconds = wallClock.length === 16 ? `${wallClock}:00` : wallClock;
  return new Date(`${withSeconds}+08:00`).toISOString();
}
