import { type KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { DetailMode } from "./appNav";
import type { ReminderList, RecurrenceUnit, Settings, Task } from "./lib/models";
import {
  addSubtask,
  addTask,
  clearTaskField,
  deleteSubtask,
  deleteTask,
  renameSubtask,
  reorderSubtasks,
  toggleSubtask,
  toggleTask,
  updateTask,
} from "./lib/store";
import { isTypingTarget } from "./lib/keyboardUtils";
import { useDragReorder } from "./lib/useDragReorder";
import { BackButton } from "./BackButton";
import { DatePicker } from "./DatePicker";
import { Dropdown } from "./Dropdown";
import { ScrollPane } from "./ScrollPane";
import { TimeField } from "./TimeField";
import { CheckboxIcon, ClearFieldIcon, DeleteIcon, PlusCircleIcon } from "./icons";

const styles = {
  pane: { padding: "30px 37px", maxWidth: 720 },
  backRow: { marginBottom: 20 },
  title: {
    fontSize: 37,
    width: "100%",
    borderBottom: "2px solid #fff",
    paddingBottom: 6,
    marginBottom: 26,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  // On desktop this input sits beside the middle pane's plain-text header,
  // but its own font-size/padding/border make its box taller, pushing it
  // visibly lower even though both start at the same top offset — pulled
  // back up by half that height difference so the two read as vertically
  // centered against each other across the pane boundary. Only applies with
  // no back button (desktop): on tablet/mobile there's no adjacent pane to
  // align with, and the shift would just crowd the back button above it.
  titleDesktopAlign: { marginTop: -7.5 },
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
  subtaskTitleInput: {
    fontSize: 19,
    flex: 1,
    textAlign: "left" as const,
    padding: 0,
    margin: 0,
    width: "100%",
    resize: "none" as const,
    overflow: "hidden" as const,
    display: "block",
  },
  addSubtaskInput: { fontSize: 19, borderBottom: "2px solid #fff", flex: 1 },
  deleteTaskAction: {
    fontSize: 18,
    letterSpacing: "0.1em",
    marginTop: 34,
  },
  confirmTitle: { fontSize: 32, marginBottom: 26, fontWeight: 400 },
  confirmBody: { fontSize: 16, lineHeight: 1.6, marginBottom: 30 },
  confirmAction: {
    fontSize: 20,
    fontWeight: 400,
    letterSpacing: "0.15em",
    textAlign: "left" as const,
  },
  toastPane: { height: "100%", display: "flex", alignItems: "center", justifyContent: "center" },
  toastText: { fontSize: 44 },
};

function autoResizeTextarea(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

// Textareas are replaced elements — the browser won't hand back a text
// offset for a point inside one. Stand up an invisible clone built from the
// same box/font metrics so caretRangeFromPoint can hit-test real text nodes,
// then map that back onto the textarea's selection.
function placeCaretAtPoint(textarea: HTMLTextAreaElement, clientX: number, clientY: number) {
  const rect = textarea.getBoundingClientRect();
  const cs = window.getComputedStyle(textarea);
  const mirror = document.createElement("div");
  mirror.textContent = textarea.value;
  Object.assign(mirror.style, {
    position: "fixed",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: "0",
    padding: cs.padding,
    border: cs.border,
    boxSizing: cs.boxSizing,
    font: cs.font,
    letterSpacing: cs.letterSpacing,
    lineHeight: cs.lineHeight,
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    overflowWrap: "break-word",
    overflow: "hidden",
    zIndex: "9999",
    opacity: "0.001",
  });
  document.body.appendChild(mirror);

  let offset = textarea.value.length;
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };
  if (doc.caretRangeFromPoint) {
    const range = doc.caretRangeFromPoint(clientX, clientY);
    if (range && mirror.contains(range.startContainer)) {
      offset = range.startContainer.nodeType === Node.TEXT_NODE ? range.startOffset : textarea.value.length;
    }
  } else if (doc.caretPositionFromPoint) {
    const pos = doc.caretPositionFromPoint(clientX, clientY);
    if (pos && mirror.contains(pos.offsetNode)) {
      offset = pos.offsetNode.nodeType === Node.TEXT_NODE ? pos.offset : textarea.value.length;
    }
  }

  document.body.removeChild(mirror);
  textarea.focus();
  textarea.setSelectionRange(offset, offset);
}

export function TaskDetailPane({
  uid,
  lists,
  settings,
  detail,
  task,
  defaultListId,
  defaultDate,
  onTaskCreated,
  onClose,
  onBack,
}: {
  uid: string;
  lists: ReminderList[];
  settings: Settings;
  detail: DetailMode;
  task: Task | null;
  defaultListId: string;
  defaultDate?: string;
  onTaskCreated: (taskId: string) => void;
  onClose: () => void;
  onBack?: () => void;
}) {
  // Lives here (not in EditTaskForm) because deleting the task makes it
  // disappear from the `tasks` list, which would otherwise unmount the form
  // — and the toast with it — well before its 1s timer finishes.
  const [showDeletedToast, setShowDeletedToast] = useState(false);

  useEffect(() => {
    if (!showDeletedToast) return;
    const t = setTimeout(() => {
      setShowDeletedToast(false);
      onClose();
    }, 1000);
    return () => clearTimeout(t);
  }, [showDeletedToast, onClose]);

  if (showDeletedToast) {
    return (
      <div style={styles.toastPane}>
        <div style={styles.toastText}>deleted</div>
      </div>
    );
  }

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
        defaultDate={defaultDate}
        onCreated={onTaskCreated}
        onBack={onBack}
      />
    );
  }
  if (!task) {
    return <div style={styles.pane} />;
  }
  return (
    <EditTaskForm
      uid={uid}
      lists={lists}
      task={task}
      onConfirmDelete={async () => {
        await deleteTask(uid, task.id);
        setShowDeletedToast(true);
      }}
      onBack={onBack}
    />
  );
}

function NewTaskForm({
  uid,
  lists,
  settings,
  defaultListId,
  defaultDate,
  onCreated,
  onBack,
}: {
  uid: string;
  lists: ReminderList[];
  settings: Settings;
  defaultListId: string;
  defaultDate?: string;
  onCreated: (taskId: string) => void;
  onBack?: () => void;
}) {
  const [title, setTitle] = useState("");

  async function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const created = await addTask(uid, {
      title: trimmed,
      listId: defaultListId,
      date: defaultDate,
      addPosition: settings.addPosition,
    });
    onCreated(created.id);
  }

  return (
    <ScrollPane style={styles.pane}>
      {onBack && (
        <div style={styles.backRow}>
          <BackButton onBack={onBack} />
        </div>
      )}
      <input
        style={onBack ? styles.title : { ...styles.title, ...styles.titleDesktopAlign }}
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
    </ScrollPane>
  );
}

function EditTaskForm({
  uid,
  lists,
  task,
  onConfirmDelete,
  onBack,
}: {
  uid: string;
  lists: ReminderList[];
  task: Task;
  onConfirmDelete: () => void;
  onBack?: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
  const [editingSubtaskClick, setEditingSubtaskClick] = useState<{ x: number; y: number } | null>(null);
  const subtaskTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { getRowProps: getSubtaskRowProps } = useDragReorder(
    task.subtasks,
    (s) => s.id,
    (reordered) => reorderSubtasks(uid, task, reordered.map((s) => s.id))
  );

  useEffect(() => setTitle(task.title), [task.id, task.title]);

  useLayoutEffect(() => {
    const el = subtaskTextareaRef.current;
    if (!el || !editingSubtaskId) return;
    autoResizeTextarea(el);
    if (editingSubtaskClick) {
      placeCaretAtPoint(el, editingSubtaskClick.x, editingSubtaskClick.y);
    } else {
      el.focus();
    }
  }, [editingSubtaskId]);

  useEffect(() => {
    if (confirmingDelete) return;
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (e.key === "Enter") {
        toggleTask(uid, task);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        setConfirmingDelete(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [uid, task, confirmingDelete]);

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

  function commitSubtaskRename(subtaskId: string) {
    const trimmed = editingSubtaskTitle.trim();
    setEditingSubtaskId(null);
    const subtask = task.subtasks.find((s) => s.id === subtaskId);
    if (!subtask || !trimmed || trimmed === subtask.title) return;
    renameSubtask(uid, task, subtaskId, trimmed);
  }

  if (confirmingDelete) {
    const message = task.recurrence
      ? "This is a recurring task. Delete all occurrences?"
      : `Are you sure you want to delete "${task.title}"?`;
    return (
      <ScrollPane style={styles.pane}>
        <div style={styles.backRow}>
          <BackButton onBack={() => setConfirmingDelete(false)} />
        </div>
        <div style={styles.confirmTitle}>Delete Task</div>
        <div style={styles.confirmBody}>{message}</div>
        <button type="button" style={styles.confirmAction} onClick={onConfirmDelete}>
          DELETE
        </button>
      </ScrollPane>
    );
  }

  return (
    <ScrollPane style={styles.pane}>
      {onBack && (
        <div style={styles.backRow}>
          <BackButton onBack={onBack} />
        </div>
      )}
      <input
        style={onBack ? styles.title : { ...styles.title, ...styles.titleDesktopAlign }}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveTitle}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />

      <div style={styles.field}>
        <div>
          <div style={styles.label}>List</div>
          <Dropdown
            value={task.listId}
            options={lists.map((l) => ({ value: l.id, label: l.title }))}
            onChange={(listId) => updateTask(uid, task.id, { listId })}
          />
        </div>
      </div>

      <div style={styles.field}>
        <div style={styles.label}>Date</div>
        <div style={styles.fieldRow}>
          <DatePicker value={task.date} onChange={(date) => updateTask(uid, task.id, { date })} />
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
      </div>

      {task.date && (
        <>
          <div style={styles.field}>
            <div style={styles.label}>Time</div>
            <div style={styles.fieldRow}>
              {task.time ? (
                <TimeField
                  key={task.id}
                  value={task.time}
                  onChange={(time) => updateTask(uid, task.id, { time })}
                />
              ) : (
                <button type="button" style={styles.value} onClick={() => updateTask(uid, task.id, { time: "09:00" })}>
                  None
                </button>
              )}
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
          </div>

          <div style={styles.field}>
            <div style={styles.label}>Recurring</div>
            <div style={styles.fieldRow}>
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
                  <Dropdown
                    value={task.recurrence.unit}
                    options={[
                      { value: "day", label: "days" },
                      { value: "week", label: "weeks" },
                      { value: "month", label: "months" },
                      { value: "year", label: "years" },
                    ]}
                    onChange={(unit) =>
                      updateTask(uid, task.id, {
                        recurrence: { ...task.recurrence!, unit: unit as RecurrenceUnit },
                      })
                    }
                  />
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
          </div>
        </>
      )}

      <div style={styles.subtasksHeader}>Subtasks</div>
      {task.subtasks.map((s) => (
        <div
          key={s.id}
          {...getSubtaskRowProps(s.id)}
          draggable={editingSubtaskId !== s.id}
          style={{ ...styles.subtaskRow, ...getSubtaskRowProps(s.id).style }}
        >
          <button type="button" onClick={() => toggleSubtask(uid, task, s.id)} aria-label="Toggle subtask">
            <CheckboxIcon checked={s.completed} size={17} />
          </button>
          {editingSubtaskId === s.id ? (
            <textarea
              ref={subtaskTextareaRef}
              rows={1}
              style={styles.subtaskTitleInput}
              value={editingSubtaskTitle}
              onChange={(e) => {
                setEditingSubtaskTitle(e.target.value);
                autoResizeTextarea(e.target);
              }}
              onBlur={() => commitSubtaskRename(s.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.target as HTMLTextAreaElement).blur();
                }
              }}
            />
          ) : (
            <button
              type="button"
              style={{ ...styles.subtaskTitle, opacity: s.completed ? 0.4 : 1 }}
              onClick={(e) => {
                setEditingSubtaskId(s.id);
                setEditingSubtaskTitle(s.title);
                setEditingSubtaskClick({ x: e.clientX, y: e.clientY });
              }}
            >
              {s.title}
            </button>
          )}
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
          <button
            type="button"
            style={styles.subtaskTitle}
            aria-label="Add subtask"
            onClick={() => setAddingSubtask(true)}
          />
        </div>
      )}

      <button type="button" style={styles.deleteTaskAction} onClick={() => setConfirmingDelete(true)}>
        DELETE TASK
      </button>
    </ScrollPane>
  );
}
