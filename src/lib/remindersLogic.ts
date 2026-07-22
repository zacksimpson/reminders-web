// Ported from the RN app's contexts/RemindersContext.tsx — the pure
// recurrence-math functions only (no framework/storage dependencies).
// generateId is swapped for a real UUID: the RN app's original
// `${Date.now()}-${random}` scheme isn't collision-safe across devices,
// which matters once Phase 2 (real sync) exists. The native Kotlin app
// already made this same switch (see data/Models.kt).

import { formatISODate, parseDateStr } from "./dateTime";
import type { Recurrence, Task } from "./models";

export function formatRecurrence(r: Recurrence): string {
  const unit = r.interval === 1 ? r.unit : `${r.unit}s`;
  return `Every ${r.interval} ${unit}`;
}

export function addInterval(
  date: Date,
  unit: Recurrence["unit"],
  interval: number
): Date {
  const d = new Date(date);
  switch (unit) {
    case "day":
      d.setDate(d.getDate() + interval);
      break;
    case "week":
      d.setDate(d.getDate() + interval * 7);
      break;
    case "month":
      d.setMonth(d.getMonth() + interval);
      break;
    case "year":
      d.setFullYear(d.getFullYear() + interval);
      break;
    default:
      break;
  }
  return d;
}

export function getNextOccurrenceDate(
  dateStr: string,
  recurrence: Recurrence
): string {
  const { y, mo, d } = parseDateStr(dateStr);
  let date = new Date(y, mo - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  do {
    date = addInterval(date, recurrence.unit, recurrence.interval);
  } while (date < today);
  return formatISODate(date);
}

export function generateId(): string {
  return crypto.randomUUID();
}

/** Builds the next occurrence of a completed recurring task, or null if the
 *  task isn't dated+recurring. Caller is responsible for persisting it. */
export function spawnNextOccurrence(task: Task): Task | null {
  if (!(task.date && task.recurrence)) {
    return null;
  }
  const nextDate = getNextOccurrenceDate(task.date, task.recurrence);
  const now = Date.now();
  return {
    id: generateId(),
    title: task.title,
    listId: task.listId,
    date: nextDate,
    time: task.time,
    recurrence: task.recurrence,
    completed: false,
    createdAt: now,
    order: task.order,
    subtasks: task.subtasks.map((s) => ({ ...s, completed: false })),
    updatedAt: now,
    deleted: false,
  };
}
