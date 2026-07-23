import { useState } from "react";
import type { ReminderList, Task } from "./lib/models";
import { compareTasksByDateTime, formatDate, formatTime, isOverdue } from "./lib/dateTime";
import { formatRecurrence } from "./lib/remindersLogic";
import { toggleTask } from "./lib/store";
import { BackButton } from "./BackButton";
import { ScrollPane } from "./ScrollPane";
import { CheckboxIcon, OverdueAsteriskIcon, PlusIcon } from "./icons";

const styles = {
  pane: { padding: "30px 24px" },
  backRow: { marginBottom: 20 },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 26,
  },
  headerTitle: { fontSize: 32, fontWeight: 400, textAlign: "left" as const },
  addButton: { display: "flex" },
  // Mobile keeps the phone app's own header shape: centered title, back and
  // add buttons pinned to the corners of the same row.
  headerMobile: {
    textAlign: "center" as const,
    fontSize: 23,
    marginBottom: 26,
    position: "relative" as const,
  },
  headerMobileTitle: { textAlign: "center" as const, fontSize: "inherit" },
  backButtonMobile: { position: "absolute" as const, left: 0, top: 3 },
  addButtonMobile: { position: "absolute" as const, right: 0, top: 3 },
  row: {
    display: "flex",
    gap: 12,
    padding: "11px 0",
    width: "100%",
    textAlign: "left" as const,
    alignItems: "flex-start",
  },
  checkboxButton: { marginTop: 2, flexShrink: 0 },
  title: { fontSize: 21 },
  meta: { fontSize: 15, marginTop: 2 },
  completedHeader: { fontSize: 17, opacity: 0.5, padding: "18px 0 12px", width: "100%", textAlign: "left" as const },
  empty: { fontSize: 19, marginTop: 40, textAlign: "left" as const },
  emptyMobile: { fontSize: 19, marginTop: 40, textAlign: "center" as const },
};

export function TaskListPane({
  uid,
  list,
  tasks,
  selectedTaskId,
  onSelectTask,
  onAddTask,
  onOpenListOptions,
  onBack,
}: {
  uid: string;
  list: ReminderList | null;
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
  onAddTask: () => void;
  onOpenListOptions: () => void;
  onBack?: () => void;
}) {
  const [showCompleted, setShowCompleted] = useState(false);

  const active = tasks.filter((t) => !t.completed).sort(compareTasksByDateTime);
  const completed = tasks
    .filter((t) => t.completed)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

  if (!list) {
    return <div style={styles.pane} />;
  }

  return (
    <ScrollPane style={styles.pane}>
      {onBack ? (
        <div style={styles.headerMobile}>
          <BackButton onBack={onBack} style={styles.backButtonMobile} />
          <button type="button" style={styles.headerMobileTitle} onClick={onOpenListOptions}>
            {list.title}
          </button>
          <button type="button" style={styles.addButtonMobile} aria-label="Add task" onClick={onAddTask}>
            <PlusIcon size={22} />
          </button>
        </div>
      ) : (
        <div style={styles.headerRow}>
          <button type="button" style={styles.headerTitle} onClick={onOpenListOptions}>
            {list.title}
          </button>
          <button type="button" style={styles.addButton} aria-label="Add task" onClick={onAddTask}>
            <PlusIcon size={22} />
          </button>
        </div>
      )}

      {tasks.length === 0 && (
        <div style={onBack ? styles.emptyMobile : styles.empty}>No tasks</div>
      )}

      {active.map((task) => (
        <TaskRow
          key={task.id}
          uid={uid}
          task={task}
          list={list}
          selected={task.id === selectedTaskId}
          onSelect={() => onSelectTask(task.id)}
        />
      ))}

      {completed.length > 0 && (
        <>
          <button
            type="button"
            style={styles.completedHeader}
            onClick={() => setShowCompleted((v) => !v)}
          >
            Completed ({completed.length})
          </button>
          {showCompleted &&
            completed.map((task) => (
              <TaskRow
                key={task.id}
                uid={uid}
                task={task}
                list={list}
                selected={task.id === selectedTaskId}
                onSelect={() => onSelectTask(task.id)}
                dimmed
              />
            ))}
        </>
      )}
    </ScrollPane>
  );
}

export function TaskRow({
  uid,
  task,
  list,
  selected,
  onSelect,
  dimmed,
}: {
  uid: string;
  task: Task;
  list: ReminderList;
  selected: boolean;
  onSelect: () => void;
  dimmed?: boolean;
}) {
  const overdue = isOverdue(task) && !task.completed;
  const metaParts = [
    list.title,
    task.date ? formatDate(task.date) : null,
    task.time ? formatTime(task.time) : null,
    task.subtasks.length ? `${task.subtasks.length} Subtask${task.subtasks.length === 1 ? "" : "s"}` : null,
  ].filter(Boolean);

  return (
    <div style={{ ...styles.row, opacity: dimmed ? 0.4 : 1 }}>
      <button
        type="button"
        style={styles.checkboxButton}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        onClick={() => toggleTask(uid, task)}
      >
        {overdue ? <OverdueAsteriskIcon /> : <CheckboxIcon checked={task.completed} />}
      </button>
      <button type="button" style={{ flex: 1, textAlign: "left" }} onClick={onSelect}>
        <div style={{ ...styles.title, textDecoration: selected ? "underline" : "none", textUnderlineOffset: 3 }}>
          {task.title}
        </div>
        <div style={styles.meta}>{metaParts.join(" · ")}</div>
        {task.recurrence && <div style={styles.meta}>{formatRecurrence(task.recurrence)}</div>}
      </button>
    </div>
  );
}
