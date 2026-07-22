// Data model, matches the RN app's contexts/RemindersContext.tsx and the
// native Kotlin app's data/Models.kt shapes, plus updatedAt/deleted fields
// seeded now so Phase 2 (real phone sync) won't need a schema migration
// later (see the project plan's Phase 2 notes).

export type RecurrenceUnit = "day" | "week" | "month" | "year";

export interface Recurrence {
  interval: number; // 1–30
  unit: RecurrenceUnit;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  listId: string;
  date?: string; // "YYYY-MM-DD"
  time?: string; // "HH:MM" 24h
  recurrence?: Recurrence;
  subtasks: Subtask[];
  completed: boolean;
  completedAt?: number;
  createdAt: number;
  order: number;
  updatedAt: number;
  deleted: boolean;
}

export interface ReminderList {
  id: string;
  title: string;
  createdAt: number;
  order: number;
  updatedAt: number;
  deleted: boolean;
}

export interface Settings {
  defaultListId: string;
  afterAddBehavior: "toast" | "go-to-list";
  addPosition: "top" | "bottom";
  showOverdue: boolean;
  updatedAt: number;
}

export const DEFAULT_SETTINGS: Omit<Settings, "updatedAt"> = {
  defaultListId: "inbox",
  afterAddBehavior: "toast",
  addPosition: "bottom",
  showOverdue: true,
};
