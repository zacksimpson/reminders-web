// Ported near-verbatim from the RN app's utils/dateTime.ts, pure, zero
// framework dependencies, so no changes needed for the browser. Omitted
// formatDisplayTime/digitsToTime/timeToDisplayParts: those exist only to
// drive RN's custom numpad time picker, which this app doesn't have, we use
// native <input type="time">, which already gives/takes "HH:MM" directly.

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Format a Date object as "YYYY-MM-DD" */
export function formatISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Parse "YYYY-MM-DD" into numeric parts */
export function parseDateStr(dateStr: string): {
  y: number;
  mo: number;
  d: number;
} {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return { y, mo, d };
}

export function getTodayStr(): string {
  return formatISODate(new Date());
}

export function getTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatISODate(d);
}

/** "HH:MM" 24h → "h:mm AM/PM" (or "HH:MM" when use24Hour is true) */
export function formatTime(time24: string, use24Hour = false): string {
  if (use24Hour) {
    return time24;
  }
  const [hStr, mStr] = time24.split(":");
  const h = Number.parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${ampm}`;
}

/** "YYYY-MM-DD" → "Jan 5" */
export function formatDate(dateStr: string): string {
  const [, mo, d] = dateStr.split("-").map(Number);
  return `${MONTHS[mo - 1]} ${d}`;
}

/** "YYYY-MM-DD" → "Jan 5, 2024" */
export function formatDisplayDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return `${MONTHS[mo - 1]} ${d}, ${y}`;
}

/** Returns true if the task's date/time is in the past. */
export function isOverdue(task: { date?: string; time?: string }): boolean {
  if (!task.date) {
    return false;
  }
  const todayStr = getTodayStr();
  if (task.time) {
    const { y, mo, d } = parseDateStr(task.date);
    const [h, m] = task.time.split(":").map(Number);
    return new Date(y, mo - 1, d, h, m, 0) < new Date();
  }
  return task.date < todayStr;
}

/**
 * Sort comparator for tasks within the same date: timed tasks before untimed,
 * untimed tasks by their manual order field.
 */
export function compareTasksByDateTime(
  a: { time?: string; order: number },
  b: { time?: string; order: number }
): number {
  if (!(a.time || b.time)) {
    return a.order - b.order;
  }
  if (!a.time) {
    return -1;
  }
  if (!b.time) {
    return 1;
  }
  return a.time.localeCompare(b.time);
}

/** Sort comparator across dates, then by time within a date. */
export function compareTasksByDateThenTime(
  a: { date?: string; time?: string; order: number },
  b: { date?: string; time?: string; order: number }
): number {
  if (a.date !== b.date) {
    return (a.date ?? "") < (b.date ?? "") ? -1 : 1;
  }
  return compareTasksByDateTime(a, b);
}
