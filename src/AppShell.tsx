import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import type { ReminderList, Settings, Task } from "./lib/models";
import { getTodayStr } from "./lib/dateTime";
import {
  ensureInboxList,
  subscribeToLists,
  subscribeToSettings,
  subscribeToTasks,
} from "./lib/store";
import { ListsPane } from "./ListsPane";
import { TaskListPane } from "./TaskListPane";
import { TaskDetailPane } from "./TaskDetailPane";
import { TodayPane } from "./TodayPane";
import { SettingsPane, type SettingKey } from "./SettingsPane";
import { SettingsDetailPane } from "./SettingsDetailPane";
import { useIsNarrow } from "./useIsNarrow";
import { useResizablePanes } from "./useResizablePanes";
import { PaneResizer } from "./PaneResizer";

export type DetailMode = { kind: "none" } | { kind: "new" } | { kind: "edit"; taskId: string };

type Section = "lists" | "today" | "settings";

// Below the breakpoint, panes stack and are navigated one at a time,
// mirroring the phone app's own tab-root -> pushed-screen -> pushed-screen model.
type MobileStage = "lists" | "tasks" | "detail";

export function AppShell({ user }: { user: User }) {
  const [lists, setLists] = useState<ReminderList[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [section, setSection] = useState<Section>("lists");
  const [activeSetting, setActiveSetting] = useState<SettingKey | null>(null);
  const [detail, setDetail] = useState<DetailMode>({ kind: "none" });
  const [mobileStage, setMobileStage] = useState<MobileStage>("lists");
  const isNarrow = useIsNarrow();
  const { widths, startDrag } = useResizablePanes();

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

  function selectSection(next: Section) {
    setSection(next);
    setDetail({ kind: "none" });
    setActiveSetting(null);
    setMobileStage(next === "lists" ? "lists" : "tasks");
  }

  const listsPane = (
    <ListsPane
      lists={lists}
      selectedListId={selectedListId}
      section={section}
      onSelectSection={selectSection}
      onSelectList={(id) => {
        setSelectedListId(id);
        setSection("lists");
        setDetail({ kind: "none" });
        setMobileStage("tasks");
      }}
      uid={user.uid}
    />
  );

  const taskListPane = (
    <TaskListPane
      uid={user.uid}
      list={lists.find((l) => l.id === selectedListId) ?? null}
      tasks={tasks.filter((t) => t.listId === selectedListId)}
      selectedTaskId={detail.kind === "edit" ? detail.taskId : null}
      onSelectTask={(taskId) => {
        setDetail({ kind: "edit", taskId });
        setMobileStage("detail");
      }}
      onAddTask={() => {
        setDetail({ kind: "new" });
        setMobileStage("detail");
      }}
      onBack={isNarrow ? () => setMobileStage("lists") : undefined}
    />
  );

  const todayPane = (
    <TodayPane
      uid={user.uid}
      lists={lists}
      tasks={tasks}
      showOverdue={settings.showOverdue}
      selectedTaskId={detail.kind === "edit" ? detail.taskId : null}
      onSelectTask={(taskId) => {
        setDetail({ kind: "edit", taskId });
        setMobileStage("detail");
      }}
      onAddTask={() => {
        setDetail({ kind: "new" });
        setMobileStage("detail");
      }}
      onBack={isNarrow ? () => setMobileStage("lists") : undefined}
    />
  );

  const settingsPane = (
    <SettingsPane
      lists={lists}
      settings={settings}
      activeSetting={activeSetting}
      onSelectSetting={(key) => {
        setActiveSetting(key);
        setMobileStage("detail");
      }}
      onBack={isNarrow ? () => setMobileStage("lists") : undefined}
    />
  );

  const middlePane = section === "today" ? todayPane : section === "settings" ? settingsPane : taskListPane;

  const taskDetailPane = (
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
      defaultListId={section === "today" ? settings.defaultListId : selectedListId ?? lists[0]?.id ?? "inbox"}
      defaultDate={section === "today" ? getTodayStr() : undefined}
      onTaskCreated={(taskId) => setDetail({ kind: "edit", taskId })}
      onClose={() => {
        setDetail({ kind: "none" });
        setMobileStage("tasks");
      }}
      onBack={
        isNarrow
          ? () => {
              setDetail({ kind: "none" });
              setMobileStage("tasks");
            }
          : undefined
      }
    />
  );

  const settingsDetailPane = (
    <SettingsDetailPane
      uid={user.uid}
      lists={lists}
      settings={settings}
      activeSetting={activeSetting}
      onBack={isNarrow ? () => setMobileStage("tasks") : undefined}
    />
  );

  const detailPane = section === "settings" ? settingsDetailPane : taskDetailPane;

  if (isNarrow) {
    return (
      <div style={{ minHeight: "100vh" }}>
        {mobileStage === "lists" && listsPane}
        {mobileStage === "tasks" && middlePane}
        {mobileStage === "detail" && detailPane}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", paddingLeft: 48, paddingRight: 48 }}>
      <div style={{ position: "relative", minHeight: "100vh" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `${widths.lists}px ${widths.tasks}px 1fr`,
            minHeight: "100vh",
          }}
        >
          {listsPane}
          {middlePane}
          {detailPane}
        </div>
        <PaneResizer left={widths.lists} onMouseDown={startDrag("lists")} />
        <PaneResizer left={widths.lists + widths.tasks} onMouseDown={startDrag("tasks")} />
      </div>
    </div>
  );
}
