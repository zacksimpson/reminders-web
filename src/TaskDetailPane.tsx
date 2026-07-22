import { type KeyboardEvent, useEffect, useState } from "react";
import type { DetailMode } from "./AppShell";
import type { ReminderList, RecurrenceUnit, Settings, Task } from "./lib/models";
import {
  addSubtask,
  addTask,
  clearTaskField,
  deleteSubtask,
  deleteTask,
  toggleSubtask,
  updateTask,
} from "./lib/store";
import { CheckboxIcon, ClearFieldIcon, DeleteIcon, PlusCircleIcon } from "./icons";

const styles = {
  pane: { padding: "30px 37px", maxWidth: 720 },
  title: {
    fontSize: 37,
    width: "100%",
    borderBottom: "2px solid #fff",
    paddingBottom: 10,
    marginBottom: 26,
  },
  field: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "13px 0",
  },
  label: { fontSize: 15, marginBottom: 3 },
  value: { fontSize: 23 },
  select: { fontSize: 23, background: "none", border: "none" },
  clearButton: { marginTop: 8, flexShrink: 0 },
  subtasksHeader: { fontSize: 15, marginTop: 24, marginBottom: 11 },
  subtaskRow: { display: "flex", gap: 12, padding: "9px 0", alignItems: "center" },
  subtaskTitle: { fontSize: 19, flex: 1, textAlign: "left" as const },
  addSubtaskInput: { fontSize: 19, borderBottom: "2px solid #fff", flex: 1 },
  deleteTaskAction: {
    fontSize: 18,
    letterSpacing: "0.1em",
    marginTop: 34,
  },
};

export function TaskDetailPane({
  uid,
  lists,
  settings,
  detail,
  task,
  defaultListId,
  onTaskCreated,
  onClose,
}: {
  uid: string;
  lists: ReminderList[];
  settings: Settings;
  detail: DetailMode;
  task: Task | null;
  defaultListId: string;
  onTaskCreated: (taskId: string) => void;
  onClose: () => void;
}) {
  if (detail.kind === "none") {
    return <div style={styles.pane} />;
  }
  if (detail.kind === "new") {
    return (
      <NewTaskForm
        uid={uid}
        lists={lists}
        settings={settings}
        defaultListId={defaultListId}
        onCreated={onTaskCreated}
      />
    );
  }
  if (!task) {
    return <div style={styles.pane} />;
  }
  return <EditTaskForm uid={uid} lists={lists} task={task} onDeleted={onClose} />;
}

function NewTaskForm({
  uid,
  lists,
  settings,
  defaultListId,
  onCreated,
}: {
  uid: string;
  lists: ReminderList[];
  settings: Settings;
  defaultListId: string;
  onCreated: (taskId: string) => void;
}) {
  const [title, setTitle] = useState("");

  async function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const created = await addTask(uid, {
      title: trimmed,
      listId: defaultListId,
      addPosition: settings.addPosition,
    });
    onCreated(created.id);
  }

  return (
    <div style={styles.pane}>
      <input
        style={styles.title}
        autoFocus
        placeholder="Task name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        onBlur={submit}
      />
      <div style={styles.label}>List</div>
      <div style={styles.value}>{lists.find((l) => l.id === defaultListId)?.title}</div>
    </div>
  );
}

function EditTaskForm({
  uid,
  lists,
  task,
  onDeleted,
}: {
  uid: string;
  lists: ReminderList[];
  task: Task;
  onDeleted: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);

  useEffect(() => setTitle(task.title), [task.id, task.title]);

  function saveTitle() {
    const trimmed = title.trim();
    if (trimmed && trimmed !== task.title) {
      updateTask(uid, task.id, { title: trimmed });
    }
  }

  async function submitNewSubtask(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setAddingSubtask(false);
      setNewSubtask("");
      return;
    }
    if (e.key !== "Enter") return;
    const trimmed = newSubtask.trim();
    if (trimmed) {
      await addSubtask(uid, task, trimmed);
    }
    setAddingSubtask(false);
    setNewSubtask("");
  }

  return (
    <div style={styles.pane}>
      <input
        style={styles.title}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveTitle}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />

      <div style={styles.field}>
        <div>
          <div style={styles.label}>List</div>
          <select
            style={styles.select}
            value={task.listId}
            onChange={(e) => updateTask(uid, task.id, { listId: e.target.value })}
          >
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.field}>
        <div>
          <div style={styles.label}>Date</div>
          {task.date ? (
            <div style={styles.value}>
              <input
                type="date"
                style={{ ...styles.select, colorScheme: "dark" }}
                value={task.date}
                onChange={(e) => updateTask(uid, task.id, { date: e.target.value })}
              />
            </div>
          ) : (
            <button
              type="button"
              style={styles.value}
              onClick={() => updateTask(uid, task.id, { date: new Date().toISOString().slice(0, 10) })}
            >
              None
            </button>
          )}
        </div>
        {task.date && (
          <button
            type="button"
            style={styles.clearButton}
            aria-label="Clear date"
            onClick={() => clearTaskField(uid, task.id, "date")}
          >
            <ClearFieldIcon />
          </button>
        )}
      </div>

      {task.date && (
        <>
          <div style={styles.field}>
            <div>
              <div style={styles.label}>Time</div>
              {task.time ? (
                <input
                  type="time"
                  style={{ ...styles.select, colorScheme: "dark" }}
                  value={task.time}
                  onChange={(e) => updateTask(uid, task.id, { time: e.target.value })}
                />
              ) : (
                <button type="button" style={styles.value} onClick={() => updateTask(uid, task.id, { time: "09:00" })}>
                  None
                </button>
              )}
            </div>
            {task.time && (
              <button
                type="button"
                style={styles.clearButton}
                aria-label="Clear time"
                onClick={() => clearTaskField(uid, task.id, "time")}
              >
                <ClearFieldIcon />
              </button>
            )}
          </div>

          <div style={styles.field}>
            <div>
              <div style={styles.label}>Recurring</div>
              {task.recurrence ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={styles.value}>Every</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    style={{ ...styles.select, width: 48 }}
                    value={task.recurrence.interval}
                    onChange={(e) =>
                      updateTask(uid, task.id, {
                        recurrence: { ...task.recurrence!, interval: Number(e.target.value) || 1 },
                      })
                    }
                  />
                  <select
                    style={styles.select}
                    value={task.recurrence.unit}
                    onChange={(e) =>
                      updateTask(uid, task.id, {
                        recurrence: { ...task.recurrence!, unit: e.target.value as RecurrenceUnit },
                      })
                    }
                  >
                    <option value="day">days</option>
                    <option value="week">weeks</option>
                    <option value="month">months</option>
                    <option value="year">years</option>
                  </select>
                </div>
              ) : (
                <button
                  type="button"
                  style={styles.value}
                  onClick={() => updateTask(uid, task.id, { recurrence: { interval: 1, unit: "week" } })}
                >
                  None
                </button>
              )}
            </div>
            {task.recurrence && (
              <button
                type="button"
                style={styles.clearButton}
                aria-label="Clear recurrence"
                onClick={() => clearTaskField(uid, task.id, "recurrence")}
              >
                <ClearFieldIcon />
              </button>
            )}
          </div>
        </>
      )}

      <div style={styles.subtasksHeader}>Subtasks</div>
      {task.subtasks.map((s) => (
        <div key={s.id} style={styles.subtaskRow}>
          <button type="button" onClick={() => toggleSubtask(uid, task, s.id)} aria-label="Toggle subtask">
            <CheckboxIcon checked={s.completed} size={17} />
          </button>
          <div style={{ ...styles.subtaskTitle, opacity: s.completed ? 0.4 : 1 }}>{s.title}</div>
          <button type="button" onClick={() => deleteSubtask(uid, task, s.id)} aria-label="Delete subtask">
            <DeleteIcon />
          </button>
        </div>
      ))}
      {addingSubtask ? (
        <div style={styles.subtaskRow}>
          <input
            style={styles.addSubtaskInput}
            autoFocus
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={submitNewSubtask}
            onBlur={() => {
              setAddingSubtask(false);
              setNewSubtask("");
            }}
          />
        </div>
      ) : (
        <div style={styles.subtaskRow}>
          <button type="button" onClick={() => setAddingSubtask(true)} aria-label="Add subtask">
            <PlusCircleIcon size={17} />
          </button>
          <button type="button" style={styles.subtaskTitle} onClick={() => setAddingSubtask(true)}>
            Add subtask…
          </button>
        </div>
      )}

      <button
        type="button"
        style={styles.deleteTaskAction}
        onClick={() => {
          deleteTask(uid, task.id);
          onDeleted();
        }}
      >
        DELETE TASK
      </button>
    </div>
  );
}
