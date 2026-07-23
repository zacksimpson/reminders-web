import { useEffect, useState } from "react";
import type { ReminderList, Task } from "./lib/models";
import { compareTasksByDateThenTime, compareTasksByDateTime, getTodayStr, isOverdue } from "./lib/dateTime";
import { TaskRow } from "./TaskListPane";
import { BackButton } from "./BackButton";
import { ScrollPane } from "./ScrollPane";
import { PlusIcon } from "./icons";

const styles = {
  pane: { padding: "30px 24px" },
  header: {
    textAlign: "center" as const,
    fontSize: 23,
    marginBottom: 26,
    position: "relative" as const,
  },
  backButton: { position: "absolute" as const, left: 0, top: 3 },
  addButton: { position: "absolute" as const, right: 0, top: 3 },
  completedHeader: { fontSize: 17, opacity: 0.5, padding: "18px 0 12px", width: "100%", textAlign: "left" as const },
  empty: { fontSize: 19, marginTop: 40, textAlign: "center" as const },
};

export function TodayPane({
  uid,
  lists,
  tasks,
  showOverdue,
  selectedTaskId,
  onSelectTask,
  onAddTask,
  onBack,
}: {
  uid: string;
  lists: ReminderList[];
  tasks: Task[];
  showOverdue: boolean;
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
  onAddTask: () => void;
  onBack?: () => void;
}) {
  const [showCompleted, setShowCompleted] = useState(false);
  // Force a re-render every minute so a task can visibly flip from active to
  // overdue in place, and the day can roll over, without navigating away.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const todayStr = getTodayStr();

  const overdueTasks = showOverdue
    ? tasks.filter((t) => !t.completed && isOverdue(t)).sort(compareTasksByDateThenTime)
    : [];

  const activeTasks = tasks
    .filter((t) => t.date === todayStr && !t.completed && !isOverdue(t))
    .sort(compareTasksByDateTime);

  const completedTasks = tasks
    .filter((t) => t.completed && (t.date === todayStr || (showOverdue && isOverdue(t))))
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

  const listById = (id: string) => lists.find((l) => l.id === id);

  return (
    <ScrollPane style={styles.pane}>
      <div style={styles.header}>
        {onBack && <BackButton onBack={onBack} style={styles.backButton} />}
        Today
        <button type="button" style={styles.addButton} aria-label="Add task" onClick={onAddTask}>
          <PlusIcon size={22} />
        </button>
      </div>

      {overdueTasks.length === 0 && activeTasks.length === 0 && completedTasks.length === 0 && (
        <div style={styles.empty}>no tasks today</div>
      )}

      {overdueTasks.map((task) => {
        const list = listById(task.listId);
        return list ? (
          <TaskRow
            key={task.id}
            uid={uid}
            task={task}
            list={list}
            selected={task.id === selectedTaskId}
            onSelect={() => onSelectTask(task.id)}
          />
        ) : null;
      })}

      {activeTasks.map((task) => {
        const list = listById(task.listId);
        return list ? (
          <TaskRow
            key={task.id}
            uid={uid}
            task={task}
            list={list}
            selected={task.id === selectedTaskId}
            onSelect={() => onSelectTask(task.id)}
          />
        ) : null;
      })}

      {completedTasks.length > 0 && (
        <>
          <button
            type="button"
            style={styles.completedHeader}
            onClick={() => setShowCompleted((v) => !v)}
          >
            Completed ({completedTasks.length})
          </button>
          {showCompleted &&
            completedTasks.map((task) => {
              const list = listById(task.listId);
              return list ? (
                <TaskRow
                  key={task.id}
                  uid={uid}
                  task={task}
                  list={list}
                  selected={task.id === selectedTaskId}
                  onSelect={() => onSelectTask(task.id)}
                  dimmed
                />
              ) : null;
            })}
        </>
      )}
    </ScrollPane>
  );
}
