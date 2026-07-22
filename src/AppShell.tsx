import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import type { ReminderList, Settings, Task } from "./lib/models";
import {
  ensureInboxList,
  subscribeToLists,
  subscribeToSettings,
  subscribeToTasks,
} from "./lib/store";
import { ListsPane } from "./ListsPane";
import { TaskListPane } from "./TaskListPane";
import { TaskDetailPane } from "./TaskDetailPane";

export type DetailMode = { kind: "none" } | { kind: "new" } | { kind: "edit"; taskId: string };

export function AppShell({ user }: { user: User }) {
  const [lists, setLists] = useState<ReminderList[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailMode>({ kind: "none" });

  useEffect(() => {
    ensureInboxList(user.uid);
    const unsubLists = subscribeToLists(user.uid, (l) => {
      setLists(l);
      setSelectedListId((current) => current ?? l[0]?.id ?? null);
    });
    const unsubTasks = subscribeToTasks(user.uid, setTasks);
    const unsubSettings = subscribeToSettings(user.uid, setSettings);
    return () => {
      unsubLists();
      unsubTasks();
      unsubSettings();
    };
  }, [user.uid]);

  if (!settings) {
    return null;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "180px 300px 1fr",
        minHeight: "100vh",
      }}
    >
      <ListsPane
        lists={lists}
        selectedListId={selectedListId}
        onSelectList={(id) => {
          setSelectedListId(id);
          setDetail({ kind: "none" });
        }}
        uid={user.uid}
      />
      <TaskListPane
        uid={user.uid}
        list={lists.find((l) => l.id === selectedListId) ?? null}
        tasks={tasks.filter((t) => t.listId === selectedListId)}
        selectedTaskId={detail.kind === "edit" ? detail.taskId : null}
        onSelectTask={(taskId) => setDetail({ kind: "edit", taskId })}
        onAddTask={() => setDetail({ kind: "new" })}
      />
      <TaskDetailPane
        uid={user.uid}
        lists={lists}
        settings={settings}
        detail={detail}
        task={
          detail.kind === "edit"
            ? tasks.find((t) => t.id === detail.taskId) ?? null
            : null
        }
        defaultListId={selectedListId ?? lists[0]?.id ?? "inbox"}
        onTaskCreated={(taskId) => setDetail({ kind: "edit", taskId })}
        onClose={() => setDetail({ kind: "none" })}
      />
    </div>
  );
}
