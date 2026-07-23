// Firestore data access, mirrors the shape of the native app's
// RemindersRepository, but as one document per row (not one JSON blob per
// collection) since that's the natural Firestore model.

import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { getNextOccurrenceDate, generateId } from "./remindersLogic";
import { DEFAULT_SETTINGS, type ReminderList, type Settings, type Task } from "./models";

const listsCol = (uid: string) => collection(db, "users", uid, "lists");
const tasksCol = (uid: string) => collection(db, "users", uid, "tasks");
const settingsDoc = (uid: string) => doc(db, "users", uid, "settings", "singleton");

export function subscribeToLists(
  uid: string,
  cb: (lists: ReminderList[]) => void
) {
  return onSnapshot(listsCol(uid), (snap) => {
    const lists = snap.docs
      .map((d) => d.data() as ReminderList)
      .filter((l) => !l.deleted)
      .sort((a, b) => a.order - b.order);
    cb(lists);
  });
}

export function subscribeToTasks(uid: string, cb: (tasks: Task[]) => void) {
  return onSnapshot(tasksCol(uid), (snap) => {
    const tasks = snap.docs
      .map((d) => d.data() as Task)
      .filter((t) => !t.deleted);
    cb(tasks);
  });
}

export function subscribeToSettings(
  uid: string,
  cb: (settings: Settings) => void
) {
  return onSnapshot(settingsDoc(uid), (snap) => {
    if (snap.exists()) {
      cb(snap.data() as Settings);
    } else {
      const settings: Settings = { ...DEFAULT_SETTINGS, updatedAt: Date.now() };
      setDoc(settingsDoc(uid), settings);
      cb(settings);
    }
  });
}

export async function updateSettings(
  uid: string,
  updates: Partial<Omit<Settings, "updatedAt">>
): Promise<void> {
  await updateDoc(settingsDoc(uid), { ...updates, updatedAt: Date.now() });
}

/** Creates the seed "Inbox" list the first time a user has none. */
export async function ensureInboxList(uid: string): Promise<void> {
  const existing = await getDocs(listsCol(uid));
  if (!existing.empty) return;
  const now = Date.now();
  const inbox: ReminderList = {
    id: "inbox",
    title: "Inbox",
    createdAt: now,
    order: 0,
    updatedAt: now,
    deleted: false,
  };
  await setDoc(doc(listsCol(uid), inbox.id), inbox);
}

export async function addList(uid: string, title: string): Promise<void> {
  const existing = await getDocs(listsCol(uid));
  const now = Date.now();
  const list: ReminderList = {
    id: generateId(),
    title,
    createdAt: now,
    order: existing.size,
    updatedAt: now,
    deleted: false,
  };
  await setDoc(doc(listsCol(uid), list.id), list);
}

export async function renameList(
  uid: string,
  id: string,
  title: string
): Promise<void> {
  await updateDoc(doc(listsCol(uid), id), { title, updatedAt: Date.now() });
}

/** Soft-deletes the list and reassigns its tasks to the default list. */
export async function deleteList(uid: string, id: string): Promise<void> {
  const settingsSnap = await getDoc(settingsDoc(uid));
  const defaultListId = settingsSnap.exists()
    ? (settingsSnap.data() as Settings).defaultListId
    : "inbox";
  const now = Date.now();
  await updateDoc(doc(listsCol(uid), id), { deleted: true, updatedAt: now });
  const affected = await getDocs(
    query(tasksCol(uid), where("listId", "==", id))
  );
  await Promise.all(
    affected.docs.map((d) =>
      updateDoc(d.ref, { listId: defaultListId, updatedAt: now })
    )
  );
}

export async function addTask(
  uid: string,
  input: {
    title: string;
    listId: string;
    date?: string;
    time?: string;
    recurrence?: Task["recurrence"];
    subtasks?: Task["subtasks"];
    addPosition: "top" | "bottom";
  }
): Promise<Task> {
  const existingInList = await getDocs(
    query(tasksCol(uid), where("listId", "==", input.listId))
  );
  const activeOrders = existingInList.docs
    .map((d) => d.data() as Task)
    .filter((t) => !t.completed && !t.deleted)
    .map((t) => t.order);
  const order =
    input.addPosition === "top"
      ? (activeOrders.length ? Math.min(...activeOrders) : 0) - 1
      : (activeOrders.length ? Math.max(...activeOrders) : -1) + 1;
  const now = Date.now();
  const task: Task = {
    id: generateId(),
    title: input.title,
    listId: input.listId,
    date: input.date,
    time: input.time,
    recurrence: input.recurrence,
    subtasks: input.subtasks ?? [],
    completed: false,
    createdAt: now,
    order,
    updatedAt: now,
    deleted: false,
  };
  await setDoc(doc(tasksCol(uid), task.id), stripUndefined(task));
  return task;
}

export async function updateTask(
  uid: string,
  id: string,
  updates: Partial<Task>
): Promise<void> {
  await updateDoc(
    doc(tasksCol(uid), id),
    stripUndefined({ ...updates, updatedAt: Date.now() })
  );
}

export async function clearTaskField(
  uid: string,
  id: string,
  field: "date" | "time" | "recurrence"
): Promise<void> {
  const patch: Record<string, unknown> = { [field]: deleteField(), updatedAt: Date.now() };
  if (field === "date") {
    patch.time = deleteField();
    patch.recurrence = deleteField();
  }
  await updateDoc(doc(tasksCol(uid), id), patch);
}

export async function deleteTask(uid: string, id: string): Promise<void> {
  await updateDoc(doc(tasksCol(uid), id), { deleted: true, updatedAt: Date.now() });
}

/** Toggle completion; completing a dated recurring task also spawns the next occurrence. */
export async function toggleTask(uid: string, task: Task): Promise<void> {
  const now = Date.now();
  const completed = !task.completed;
  await updateDoc(doc(tasksCol(uid), task.id), {
    completed,
    completedAt: completed ? now : deleteField(),
    updatedAt: now,
  });
  if (completed && task.date && task.recurrence) {
    const nextDate = getNextOccurrenceDate(task.date, task.recurrence);
    const next: Task = {
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
    await setDoc(doc(tasksCol(uid), next.id), stripUndefined(next));
  }
}

export async function addSubtask(
  uid: string,
  task: Task,
  title: string
): Promise<void> {
  const subtask = { id: generateId(), title, completed: false, createdAt: Date.now() };
  await updateDoc(doc(tasksCol(uid), task.id), {
    subtasks: [...task.subtasks, subtask],
    updatedAt: Date.now(),
  });
}

export async function renameSubtask(
  uid: string,
  task: Task,
  subtaskId: string,
  title: string
): Promise<void> {
  const subtasks = task.subtasks.map((s) => (s.id === subtaskId ? { ...s, title } : s));
  await updateDoc(doc(tasksCol(uid), task.id), { subtasks, updatedAt: Date.now() });
}

export async function toggleSubtask(
  uid: string,
  task: Task,
  subtaskId: string
): Promise<void> {
  const subtasks = task.subtasks.map((s) =>
    s.id === subtaskId ? { ...s, completed: !s.completed } : s
  );
  await updateDoc(doc(tasksCol(uid), task.id), { subtasks, updatedAt: Date.now() });
}

export async function deleteSubtask(
  uid: string,
  task: Task,
  subtaskId: string
): Promise<void> {
  const subtasks = task.subtasks.filter((s) => s.id !== subtaskId);
  await updateDoc(doc(tasksCol(uid), task.id), { subtasks, updatedAt: Date.now() });
}

// Matches the phone app's utils/backup.ts export format exactly, so a file
// exported from the phone (or the old RN app) can be dropped in here.
type BackupList = Pick<ReminderList, "id" | "title" | "createdAt" | "order">;
type BackupTask = Pick<
  Task,
  | "id"
  | "title"
  | "listId"
  | "date"
  | "time"
  | "recurrence"
  | "subtasks"
  | "completed"
  | "completedAt"
  | "createdAt"
  | "order"
>;

export interface BackupData {
  lists: BackupList[];
  tasks: BackupTask[];
}

/** Throws if the file doesn't look like a Reminders backup. */
export function parseBackupFile(json: string): BackupData {
  const raw = JSON.parse(json) as { version?: unknown; lists?: unknown; tasks?: unknown };
  if (typeof raw.version !== "number" || !Array.isArray(raw.lists) || !Array.isArray(raw.tasks)) {
    throw new Error("That file isn't a valid Reminders backup.");
  }
  return { lists: raw.lists as BackupList[], tasks: raw.tasks as BackupTask[] };
}

/**
 * Adds lists/tasks from a backup that aren't already present (matched by id).
 * Mirrors the phone app's restoreBackup: nothing is ever removed or
 * overwritten, and settings from the file are intentionally not restored.
 */
export async function importBackup(
  uid: string,
  data: BackupData
): Promise<{ listsAdded: number; tasksAdded: number }> {
  const [existingLists, existingTasks] = await Promise.all([
    getDocs(listsCol(uid)),
    getDocs(tasksCol(uid)),
  ]);
  const existingListIds = new Set(existingLists.docs.map((d) => d.id));
  const existingTaskIds = new Set(existingTasks.docs.map((d) => d.id));

  const newLists = data.lists.filter((l) => !existingListIds.has(l.id));
  const newTasks = data.tasks.filter((t) => !existingTaskIds.has(t.id));
  const now = Date.now();

  await Promise.all([
    ...newLists.map((l) =>
      setDoc(
        doc(listsCol(uid), l.id),
        stripUndefined({ ...l, updatedAt: now, deleted: false })
      )
    ),
    ...newTasks.map((t) =>
      setDoc(
        doc(tasksCol(uid), t.id),
        stripUndefined({ ...t, subtasks: t.subtasks ?? [], updatedAt: now, deleted: false })
      )
    ),
  ]);

  return { listsAdded: newLists.length, tasksAdded: newTasks.length };
}

function stripUndefined<T extends object>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/** Wipes all Firestore data for a user. Call before deleting their auth account. */
export async function deleteAllUserData(uid: string): Promise<void> {
  const [lists, tasks] = await Promise.all([getDocs(listsCol(uid)), getDocs(tasksCol(uid))]);
  await Promise.all([
    ...lists.docs.map((d) => deleteDoc(d.ref)),
    ...tasks.docs.map((d) => deleteDoc(d.ref)),
    deleteDoc(settingsDoc(uid)),
  ]);
}
