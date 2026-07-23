import { type FormEvent, type KeyboardEvent, useEffect, useState } from "react";
import type { ReminderList, RecurrenceUnit, Settings, Subtask } from "./lib/models";
import { generateId } from "./lib/remindersLogic";
import { addTask } from "./lib/store";
import { BackButton } from "./BackButton";
import { ScrollPane } from "./ScrollPane";
import { CheckboxIcon, ClearFieldIcon, DeleteIcon, PlusCircleIcon } from "./icons";

const styles = {
  pane: { padding: "30px 37px", maxWidth: 720 },
  backRow: { marginBottom: 20 },
  title: {
    fontSize: 37,
    width: "100%",
    borderBottom: "2px solid #fff",
    paddingBottom: 10,
    marginBottom: 26,
  },
  field: { padding: "13px 0" },
  fieldRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { fontSize: 15, marginBottom: 3 },
  value: { fontSize: 23 },
  select: { fontSize: 23, background: "none", border: "none" },
  clearButton: { flexShrink: 0 },
  subtasksHeader: { fontSize: 15, marginTop: 24, marginBottom: 11 },
  subtaskRow: { display: "flex", gap: 12, padding: "9px 0", alignItems: "center" },
  subtaskTitle: { fontSize: 19, flex: 1, textAlign: "left" as const },
  subtaskTitleInput: { fontSize: 19, flex: 1, textAlign: "left" as const, paddingLeft: 0 },
  addSubtaskInput: { fontSize: 19, borderBottom: "2px solid #fff", flex: 1 },
  cancelAction: {
    fontSize: 18,
    letterSpacing: "0.1em",
    marginTop: 34,
  },
  toastPane: { height: "100%", display: "flex", alignItems: "center", justifyContent: "center" },
  toastText: { fontSize: 44 },
};

export function AddTaskPane({
  uid,
  lists,
  settings,
  onBack,
  onCreated,
  onCancel,
}: {
  uid: string;
  lists: ReminderList[];
  settings: Settings;
  onBack?: () => void;
  onCreated: (taskId: string, listId: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [listId, setListId] = useState(settings.defaultListId);
  const [date, setDate] = useState<string | undefined>(undefined);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [recurrence, setRecurrence] = useState<{ interval: number; unit: RecurrenceUnit } | undefined>(undefined);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => {
      setShowToast(false);
      resetForm(true);
    }, 1000);
    return () => clearTimeout(t);
  }, [showToast]);

  function resetForm(keepList: boolean) {
    setTitle("");
    if (!keepList) {
      setListId(settings.defaultListId);
    }
    setDate(undefined);
    setTime(undefined);
    setRecurrence(undefined);
    setSubtasks([]);
    setNewSubtask("");
    setAddingSubtask(false);
    setEditingSubtaskId(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    const task = await addTask(uid, {
      title: trimmed,
      listId,
      date,
      time,
      recurrence,
      subtasks,
      addPosition: settings.addPosition,
    });
    setSaving(false);

    if (settings.afterAddBehavior === "toast") {
      setShowToast(true);
    } else {
      onCreated(task.id, listId);
    }
  }

  function submitNewSubtask(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setAddingSubtask(false);
      setNewSubtask("");
      return;
    }
    if (e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = newSubtask.trim();
    if (trimmed) {
      setSubtasks((prev) => [...prev, { id: generateId(), title: trimmed, completed: false, createdAt: Date.now() }]);
    }
    setAddingSubtask(false);
    setNewSubtask("");
  }

  function commitSubtaskRename(subtaskId: string) {
    const trimmed = editingSubtaskTitle.trim();
    setEditingSubtaskId(null);
    if (!trimmed) return;
    setSubtasks((prev) => prev.map((s) => (s.id === subtaskId ? { ...s, title: trimmed } : s)));
  }

  if (showToast) {
    return (
      <div style={styles.toastPane}>
        <div style={styles.toastText}>added</div>
      </div>
    );
  }

  return (
    <ScrollPane style={styles.pane}>
      <form onSubmit={handleSubmit}>
        {onBack && (
          <div style={styles.backRow}>
            <BackButton onBack={onBack} />
          </div>
        )}

        <input
          style={styles.title}
          autoFocus
          placeholder="Task name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* With no visible submit button, browsers won't implicitly submit on
            Enter once a form has more than one field — this hidden button
            restores that so pressing Enter anywhere saves the task. */}
        <button type="submit" aria-hidden="true" tabIndex={-1} style={{ display: "none" }} />

        <div style={styles.field}>
          <div>
            <div style={styles.label}>List</div>
            <select style={styles.select} value={listId} onChange={(e) => setListId(e.target.value)}>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.field}>
          <div style={styles.label}>Date</div>
          <div style={styles.fieldRow}>
            {date ? (
              <div style={styles.value}>
                <input
                  type="date"
                  style={{ ...styles.select, colorScheme: "dark" }}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            ) : (
              <button
                type="button"
                style={styles.value}
                onClick={() => setDate(new Date().toISOString().slice(0, 10))}
              >
                None
              </button>
            )}
            {date && (
              <button
                type="button"
                style={styles.clearButton}
                aria-label="Clear date"
                onClick={() => {
                  setDate(undefined);
                  setTime(undefined);
                  setRecurrence(undefined);
                }}
              >
                <ClearFieldIcon />
              </button>
            )}
          </div>
        </div>

        {date && (
          <>
            <div style={styles.field}>
              <div style={styles.label}>Time</div>
              <div style={styles.fieldRow}>
                {time ? (
                  <input
                    type="time"
                    style={{ ...styles.select, colorScheme: "dark" }}
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                ) : (
                  <button type="button" style={styles.value} onClick={() => setTime("09:00")}>
                    None
                  </button>
                )}
                {time && (
                  <button
                    type="button"
                    style={styles.clearButton}
                    aria-label="Clear time"
                    onClick={() => setTime(undefined)}
                  >
                    <ClearFieldIcon />
                  </button>
                )}
              </div>
            </div>

            <div style={styles.field}>
              <div style={styles.label}>Recurring</div>
              <div style={styles.fieldRow}>
                {recurrence ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={styles.value}>Every</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      style={{ ...styles.select, width: 48 }}
                      value={recurrence.interval}
                      onChange={(e) =>
                        setRecurrence((r) => ({ interval: Number(e.target.value) || 1, unit: r?.unit ?? "week" }))
                      }
                    />
                    <select
                      style={styles.select}
                      value={recurrence.unit}
                      onChange={(e) =>
                        setRecurrence((r) => ({
                          interval: r?.interval ?? 1,
                          unit: e.target.value as RecurrenceUnit,
                        }))
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
                    onClick={() => setRecurrence({ interval: 1, unit: "week" })}
                  >
                    None
                  </button>
                )}
                {recurrence && (
                  <button
                    type="button"
                    style={styles.clearButton}
                    aria-label="Clear recurrence"
                    onClick={() => setRecurrence(undefined)}
                  >
                    <ClearFieldIcon />
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        <div style={styles.subtasksHeader}>Subtasks</div>
        {subtasks.map((s) => (
          <div key={s.id} style={styles.subtaskRow}>
            <button
              type="button"
              onClick={() =>
                setSubtasks((prev) => prev.map((x) => (x.id === s.id ? { ...x, completed: !x.completed } : x)))
              }
              aria-label="Toggle subtask"
            >
              <CheckboxIcon checked={s.completed} size={17} />
            </button>
            {editingSubtaskId === s.id ? (
              <input
                autoFocus
                style={styles.subtaskTitleInput}
                value={editingSubtaskTitle}
                onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                onBlur={() => commitSubtaskRename(s.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    (e.target as HTMLInputElement).blur();
                  }
                }}
              />
            ) : (
              <button
                type="button"
                style={{ ...styles.subtaskTitle, opacity: s.completed ? 0.4 : 1 }}
                onClick={() => {
                  setEditingSubtaskId(s.id);
                  setEditingSubtaskTitle(s.title);
                }}
              >
                {s.title}
              </button>
            )}
            <button
              type="button"
              onClick={() => setSubtasks((prev) => prev.filter((x) => x.id !== s.id))}
              aria-label="Delete subtask"
            >
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

        <button type="button" style={styles.cancelAction} onClick={onCancel}>
          CANCEL
        </button>
      </form>
    </ScrollPane>
  );
}
