import { useEffect, useReducer, useState } from "react";
import type { User } from "firebase/auth";
import type { ReminderList, Settings, Task } from "./lib/models";
import { getTodayStr } from "./lib/dateTime";
import { isTypingTarget } from "./lib/keyboardUtils";
import { applyOrder } from "./lib/ordering";
import {
  ensureInboxList,
  subscribeToLists,
  subscribeToSettings,
  subscribeToTasks,
} from "./lib/store";
import { appNavReducer, initialAppNavState, isShowingDetail } from "./appNav";
import { ListsPane } from "./ListsPane";
import { ListOptionsPane } from "./ListOptionsPane";
import { AddTaskPane } from "./AddTaskPane";
import { TaskListPane } from "./TaskListPane";
import { TaskDetailPane } from "./TaskDetailPane";
import { TodayPane } from "./TodayPane";
import { SettingsPane } from "./SettingsPane";
import { SettingsDetailPane } from "./SettingsDetailPane";
import { AccountPane } from "./AccountPane";
import { AccountDetailPane } from "./AccountDetailPane";
import { useLayoutTier } from "./useLayoutTier";
import { useResizablePanes } from "./useResizablePanes";
import { useBrowserNotifications } from "./useBrowserNotifications";
import { PaneResizer } from "./PaneResizer";

export function AppShell({ user }: { user: User }) {
  const [lists, setLists] = useState<ReminderList[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [nav, dispatch] = useReducer(appNavReducer, initialAppNavState);
  const tier = useLayoutTier();
  const { widths, startDrag } = useResizablePanes();
  const notifications = useBrowserNotifications(tasks, lists);

  const { selectedListId, mobileStage, screen } = nav;

  useEffect(() => {
    ensureInboxList(user.uid);
    const unsubLists = subscribeToLists(user.uid, (l) => {
      setLists(l);
      dispatch({ type: "LISTS_LOADED", firstListId: l[0]?.id ?? null });
    });
    const unsubTasks = subscribeToTasks(user.uid, setTasks);
    const unsubSettings = subscribeToSettings(user.uid, setSettings);
    return () => {
      unsubLists();
      unsubTasks();
      unsubSettings();
    };
  }, [user.uid]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (e.key === "1") {
        e.preventDefault();
        dispatch({ type: "SELECT_SECTION", section: "add" });
      } else if (e.key === "2") {
        e.preventDefault();
        dispatch({ type: "SELECT_SECTION", section: "today" });
      } else if (e.key === "3") {
        e.preventDefault();
        dispatch({ type: "SELECT_SECTION", section: "settings" });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!settings) {
    return null;
  }

  // Lists not yet captured by settings.listOrder (new, or created before this
  // field existed) fall back to their own legacy `order` field, appended after
  // the ones settings.listOrder does know about.
  const orderedLists = applyOrder(lists, (l) => l.id, settings.listOrder, (a, b) => a.order - b.order);

  const showingDetail = isShowingDetail(screen);

  // Lists stays visible alongside the middle content at both desktop and
  // tablet tiers, so the middle pane's own back arrow is mobile-only.
  const middleBack = tier === "mobile" ? () => dispatch({ type: "GO_TO_MOBILE_LISTS" }) : undefined;
  // The detail pane pushes in as its own screen at both tablet and mobile.
  const detailBack = tier !== "desktop" ? () => dispatch({ type: "GO_BACK_FROM_DETAIL" }) : undefined;

  const detail =
    screen.section === "lists" || screen.section === "today" ? screen.detail : { kind: "none" as const };
  const activeSetting = screen.section === "settings" ? screen.activeSetting : null;
  const settingsView = screen.section === "settings" ? screen.settingsView : "root";
  const activeAccountAction = screen.section === "account" ? screen.activeAccountAction : null;

  const listsPane = (
    <ListsPane
      lists={orderedLists}
      selectedListId={selectedListId}
      section={screen.section}
      onSelectSection={(section) => dispatch({ type: "SELECT_SECTION", section })}
      onSelectList={(id) => dispatch({ type: "SELECT_LIST", listId: id })}
      uid={user.uid}
    />
  );

  const taskListPane = (
    <TaskListPane
      uid={user.uid}
      list={orderedLists.find((l) => l.id === selectedListId) ?? null}
      tasks={tasks.filter((t) => t.listId === selectedListId)}
      selectedTaskId={detail.kind === "edit" ? detail.taskId : null}
      onSelectTask={(taskId) => dispatch({ type: "OPEN_TASK", taskId })}
      onAddTask={() => dispatch({ type: "OPEN_NEW_TASK" })}
      onOpenListOptions={() => dispatch({ type: "OPEN_LIST_OPTIONS" })}
      onBack={middleBack}
    />
  );

  const todayPane = (
    <TodayPane
      uid={user.uid}
      lists={orderedLists}
      tasks={tasks}
      showOverdue={settings.showOverdue}
      selectedTaskId={detail.kind === "edit" ? detail.taskId : null}
      onSelectTask={(taskId) => dispatch({ type: "OPEN_TASK", taskId })}
      onAddTask={() => dispatch({ type: "OPEN_NEW_TASK" })}
      onBack={middleBack}
    />
  );

  const settingsPane = (
    <SettingsPane
      lists={orderedLists}
      settings={settings}
      activeSetting={activeSetting}
      settingsView={settingsView}
      onSelectSetting={(key) => dispatch({ type: "OPEN_SETTING", key })}
      onOpenTaskBehaviors={() => dispatch({ type: "OPEN_TASK_BEHAVIORS" })}
      onBackToSettingsRoot={() => dispatch({ type: "BACK_TO_SETTINGS_ROOT" })}
      onBack={middleBack}
    />
  );

  const accountPane = (
    <AccountPane
      activeAccountAction={activeAccountAction}
      onSelectAccountAction={(key) => dispatch({ type: "OPEN_ACCOUNT_ACTION", key })}
      onBack={middleBack}
    />
  );

  const addTaskPane = (
    <AddTaskPane
      uid={user.uid}
      lists={orderedLists}
      settings={settings}
      onBack={middleBack}
      onCreated={(_taskId, listId) => dispatch({ type: "ADD_TASK_SAVED", listId })}
      onCancel={() => dispatch({ type: "CANCEL_ADD_TASK", defaultListId: settings.defaultListId })}
    />
  );

  const middlePane =
    screen.section === "today"
      ? todayPane
      : screen.section === "settings"
        ? settingsPane
        : screen.section === "account"
          ? accountPane
          : screen.section === "add"
            ? addTaskPane
            : taskListPane;

  const taskDetailPane = (
    <TaskDetailPane
      uid={user.uid}
      lists={orderedLists}
      settings={settings}
      detail={detail}
      task={detail.kind === "edit" ? tasks.find((t) => t.id === detail.taskId) ?? null : null}
      defaultListId={
        screen.section === "today"
          ? settings.defaultListId
          : (selectedListId ?? orderedLists[0]?.id ?? "inbox")
      }
      defaultDate={screen.section === "today" ? getTodayStr() : undefined}
      onTaskCreated={(taskId) => dispatch({ type: "TASK_CREATED", taskId })}
      onClose={() => dispatch({ type: "GO_BACK_FROM_DETAIL" })}
      onBack={detailBack}
    />
  );

  const settingsDetailPane = (
    <SettingsDetailPane
      uid={user.uid}
      lists={orderedLists}
      settings={settings}
      activeSetting={activeSetting}
      notifications={notifications}
      onBack={detailBack}
    />
  );

  const accountDetailPane = (
    <AccountDetailPane activeAccountAction={activeAccountAction} onBack={detailBack} />
  );

  const currentList = orderedLists.find((l) => l.id === selectedListId) ?? null;
  const listOptionsPane = currentList && (
    <ListOptionsPane
      uid={user.uid}
      list={currentList}
      onBack={detailBack}
      onDeleted={() => dispatch({ type: "LIST_DELETED", defaultListId: settings.defaultListId })}
    />
  );

  const detailPane =
    screen.section === "settings"
      ? settingsDetailPane
      : screen.section === "account"
        ? accountDetailPane
        : screen.section === "lists" && detail.kind === "list-options"
          ? listOptionsPane
          : taskDetailPane;

  if (tier === "mobile") {
    return (
      <div style={{ minHeight: "100vh" }}>
        {mobileStage === "lists" && listsPane}
        {mobileStage === "tasks" && middlePane}
        {mobileStage === "detail" && detailPane}
      </div>
    );
  }

  const outerPadding = { paddingTop: 56, paddingBottom: 56, paddingLeft: 60, paddingRight: 60 };

  if (tier === "tablet") {
    if (showingDetail) {
      return <div style={{ height: "100vh", ...outerPadding }}>{detailPane}</div>;
    }
    return (
      <div style={{ height: "100vh", ...outerPadding }}>
        <div style={{ position: "relative", height: "100%" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `${widths.lists}px 1fr`,
              height: "100%",
            }}
          >
            {listsPane}
            {middlePane}
          </div>
          <PaneResizer left={widths.lists} onMouseDown={startDrag("lists")} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", ...outerPadding }}>
      {/* On very wide screens the 1fr detail column would otherwise stretch
          indefinitely, pinning all three panes to the left with a huge dead
          gap on the right. Cap the whole layout and center it instead, same
          fix as any content site uses for ultrawide monitors. 1920 comes from
          the max pane widths + the detail pane's own 720px content cap + its
          padding + a bit of intentional breathing room, not an arbitrary round
          number. */}
      <div style={{ maxWidth: 1920, height: "100%", margin: "0 auto" }}>
        <div style={{ position: "relative", height: "100%" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `${widths.lists}px ${widths.tasks}px 1fr`,
              height: "100%",
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
    </div>
  );
}
