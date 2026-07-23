import { useEffect, useRef, useState } from "react";
import { compareTasksByDateThenTime, getTodayStr, parseDateStr } from "./lib/dateTime";
import {
  getPermission,
  notificationsSupported,
  requestPermission,
  showNotification,
} from "./lib/browserNotifications";
import type { ReminderList, Task } from "./lib/models";

const STORAGE_KEY = "reminders-web:notifications";
const CHECK_INTERVAL_MS = 30_000;
// Notifications this stale when first noticed (tab was closed/backgrounded
// past the due time) are marked handled but not shown, so reopening the tab
// doesn't dump a backlog of stale alerts.
const FRESHNESS_WINDOW_MS = 5 * 60_000;

interface Prefs {
  enabled: boolean;
  todaysTasksEnabled: boolean;
  todaysTasksTime: string;
}

const DEFAULT_PREFS: Prefs = {
  enabled: false,
  todaysTasksEnabled: false,
  todaysTasksTime: "09:00",
};

function loadPrefs(): Prefs {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "");
    return {
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULT_PREFS.enabled,
      todaysTasksEnabled:
        typeof parsed.todaysTasksEnabled === "boolean"
          ? parsed.todaysTasksEnabled
          : DEFAULT_PREFS.todaysTasksEnabled,
      todaysTasksTime:
        typeof parsed.todaysTasksTime === "string" ? parsed.todaysTasksTime : DEFAULT_PREFS.todaysTasksTime,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function taskDateTimeMs(date: string, time: string): number {
  const { y, mo, d } = parseDateStr(date);
  const [h, m] = time.split(":").map(Number);
  return new Date(y, mo - 1, d, h, m, 0).getTime();
}

export interface BrowserNotificationsApi {
  enabled: boolean;
  todaysTasksEnabled: boolean;
  todaysTasksTime: string;
  permissionDenied: boolean;
  supported: boolean;
  setEnabled: (v: boolean) => Promise<void>;
  setTodaysTasksEnabled: (v: boolean) => void;
  setTodaysTasksTime: (time: string) => void;
}

/**
 * Browser-only equivalent of the phone app's NotificationsContext. There's no
 * OS-level scheduler on the web, so instead of scheduling ahead of time, this
 * polls the task list every 30s while enabled and fires a Notification the
 * moment something comes due — meaning it only works while this tab is open.
 */
export function useBrowserNotifications(tasks: Task[], lists: ReminderList[]): BrowserNotificationsApi {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [permissionDenied, setPermissionDenied] = useState(getPermission() === "denied");
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    if (!(prefs.enabled && notificationsSupported())) {
      return;
    }

    function check() {
      const now = Date.now();

      for (const task of tasks) {
        if (task.completed || !(task.date && task.time)) {
          continue;
        }
        // Keyed on updatedAt (not just task id) so editing a task's date/time
        // after it was already evaluated — e.g. snoozing an overdue task —
        // re-arms it instead of leaving it permanently marked handled.
        const key = `task-${task.id}-${task.updatedAt}`;
        if (firedRef.current.has(key)) {
          continue;
        }
        const target = taskDateTimeMs(task.date, task.time);
        if (target > now) {
          continue;
        }
        firedRef.current.add(key);
        if (now - target < FRESHNESS_WINDOW_MS) {
          const list = lists.find((l) => l.id === task.listId);
          showNotification(task.title, list?.title ?? "");
        }
      }

      if (prefs.todaysTasksEnabled) {
        const todayStr = getTodayStr();
        const key = `bundle-${todayStr}`;
        const target = taskDateTimeMs(todayStr, prefs.todaysTasksTime);
        if (!firedRef.current.has(key) && target <= now) {
          firedRef.current.add(key);
          if (now - target < FRESHNESS_WINDOW_MS) {
            const due = tasks
              .filter((t) => !t.completed && t.date && t.date <= todayStr)
              .sort(compareTasksByDateThenTime);
            if (due.length > 0) {
              const rest = due.length - 1;
              showNotification(due[0].title, rest > 0 ? `and ${rest} other task${rest === 1 ? "" : "s"}` : "");
            }
          }
        }
      }
    }

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [prefs.enabled, prefs.todaysTasksEnabled, prefs.todaysTasksTime, tasks, lists]);

  async function setEnabled(v: boolean) {
    if (v) {
      const granted = await requestPermission();
      if (!granted) {
        setPermissionDenied(true);
        return;
      }
      setPermissionDenied(false);
    }
    setPrefs((p) => ({ ...p, enabled: v }));
  }

  function setTodaysTasksEnabled(v: boolean) {
    setPrefs((p) => ({ ...p, todaysTasksEnabled: v }));
  }

  function setTodaysTasksTime(time: string) {
    setPrefs((p) => ({ ...p, todaysTasksTime: time }));
  }

  return {
    enabled: prefs.enabled,
    todaysTasksEnabled: prefs.todaysTasksEnabled,
    todaysTasksTime: prefs.todaysTasksTime,
    permissionDenied,
    supported: notificationsSupported(),
    setEnabled,
    setTodaysTasksEnabled,
    setTodaysTasksTime,
  };
}
