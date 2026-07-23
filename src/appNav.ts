// AppShell's navigation state, consolidated into one reducer instead of
// several independent useState calls. The old shape required every handler
// that changed screens to remember which sibling flags to reset by hand
// (e.g. clearing activeSetting when switching sections, but NOT
// settingsView when merely closing a Task Behaviors sub-screen) — a class of
// bug that already bit the Task Behaviors feature once. Modeling "what
// screen are we on" as one discriminated union means each action fully
// determines the resulting state in a single place, and the reducer is a
// pure function that's trivially testable without touching the DOM.

import type { AccountKey } from "./AccountPane";
import type { SettingKey, SettingsView } from "./SettingsPane";

export type DetailMode =
  | { kind: "none" }
  | { kind: "new" }
  | { kind: "edit"; taskId: string }
  | { kind: "list-options" };

// Below the desktop breakpoint, panes stack and are navigated one screen at a
// time, mirroring the phone app's own tab-root -> pushed-screen model. At the
// tablet tier, Lists + middle content stay paired and only the detail pane
// pushes in as its own screen; at the mobile tier every pane is its own screen.
export type MobileStage = "lists" | "tasks" | "detail";

export type Screen =
  | { section: "lists"; detail: DetailMode }
  | { section: "today"; detail: DetailMode }
  | { section: "settings"; activeSetting: SettingKey | null; settingsView: SettingsView }
  | { section: "account"; activeAccountAction: AccountKey | null }
  | { section: "add" };

export interface AppNavState {
  selectedListId: string | null;
  mobileStage: MobileStage;
  screen: Screen;
}

export type AppNavAction =
  | { type: "SELECT_SECTION"; section: "today" | "settings" | "account" | "add" }
  | { type: "SELECT_LIST"; listId: string }
  | { type: "OPEN_TASK"; taskId: string }
  | { type: "OPEN_NEW_TASK" }
  | { type: "TASK_CREATED"; taskId: string }
  | { type: "OPEN_LIST_OPTIONS" }
  | { type: "LIST_DELETED"; defaultListId: string }
  | { type: "OPEN_SETTING"; key: SettingKey }
  | { type: "OPEN_TASK_BEHAVIORS" }
  | { type: "BACK_TO_SETTINGS_ROOT" }
  | { type: "OPEN_ACCOUNT_ACTION"; key: AccountKey }
  | { type: "ADD_TASK_SAVED"; listId: string }
  | { type: "CANCEL_ADD_TASK"; defaultListId: string }
  | { type: "GO_BACK_FROM_DETAIL" }
  | { type: "GO_TO_MOBILE_LISTS" }
  | { type: "LISTS_LOADED"; firstListId: string | null };

export const initialAppNavState: AppNavState = {
  selectedListId: null,
  mobileStage: "lists",
  screen: { section: "lists", detail: { kind: "none" } },
};

export function appNavReducer(state: AppNavState, action: AppNavAction): AppNavState {
  switch (action.type) {
    case "SELECT_SECTION": {
      const screen: Screen =
        action.section === "settings"
          ? { section: "settings", activeSetting: null, settingsView: "root" }
          : action.section === "account"
            ? { section: "account", activeAccountAction: null }
            : action.section === "add"
              ? { section: "add" }
              : { section: "today", detail: { kind: "none" } };
      return { ...state, screen, mobileStage: "tasks" };
    }

    case "SELECT_LIST":
      return {
        ...state,
        selectedListId: action.listId,
        screen: { section: "lists", detail: { kind: "none" } },
        mobileStage: "tasks",
      };

    case "OPEN_TASK":
      if (state.screen.section !== "lists" && state.screen.section !== "today") {
        return state;
      }
      return {
        ...state,
        screen: { ...state.screen, detail: { kind: "edit", taskId: action.taskId } },
        mobileStage: "detail",
      };

    case "OPEN_NEW_TASK":
      if (state.screen.section !== "lists" && state.screen.section !== "today") {
        return state;
      }
      return { ...state, screen: { ...state.screen, detail: { kind: "new" } }, mobileStage: "detail" };

    case "TASK_CREATED":
      if (state.screen.section !== "lists" && state.screen.section !== "today") {
        return state;
      }
      return { ...state, screen: { ...state.screen, detail: { kind: "edit", taskId: action.taskId } } };

    case "OPEN_LIST_OPTIONS":
      if (state.screen.section !== "lists") {
        return state;
      }
      return { ...state, screen: { section: "lists", detail: { kind: "list-options" } }, mobileStage: "detail" };

    case "LIST_DELETED":
      return {
        ...state,
        selectedListId: action.defaultListId,
        screen: { section: "lists", detail: { kind: "none" } },
        mobileStage: "tasks",
      };

    case "OPEN_SETTING":
      if (state.screen.section !== "settings") {
        return state;
      }
      return { ...state, screen: { ...state.screen, activeSetting: action.key }, mobileStage: "detail" };

    case "OPEN_TASK_BEHAVIORS":
      if (state.screen.section !== "settings") {
        return state;
      }
      return { ...state, screen: { ...state.screen, settingsView: "task-behaviors" } };

    case "BACK_TO_SETTINGS_ROOT":
      if (state.screen.section !== "settings") {
        return state;
      }
      return { ...state, screen: { ...state.screen, settingsView: "root" } };

    case "OPEN_ACCOUNT_ACTION":
      if (state.screen.section !== "account") {
        return state;
      }
      return {
        ...state,
        screen: { section: "account", activeAccountAction: action.key },
        mobileStage: "detail",
      };

    case "ADD_TASK_SAVED":
      return {
        ...state,
        selectedListId: action.listId,
        screen: { section: "lists", detail: { kind: "none" } },
        mobileStage: "tasks",
      };

    case "CANCEL_ADD_TASK":
      return {
        ...state,
        selectedListId: action.defaultListId,
        screen: { section: "lists", detail: { kind: "none" } },
        mobileStage: "tasks",
      };

    case "GO_BACK_FROM_DETAIL": {
      const { screen } = state;
      if (screen.section === "lists" || screen.section === "today") {
        return { ...state, screen: { ...screen, detail: { kind: "none" } }, mobileStage: "tasks" };
      }
      if (screen.section === "settings") {
        return { ...state, screen: { ...screen, activeSetting: null }, mobileStage: "tasks" };
      }
      if (screen.section === "account") {
        return { ...state, screen: { ...screen, activeAccountAction: null }, mobileStage: "tasks" };
      }
      return state;
    }

    case "GO_TO_MOBILE_LISTS":
      return { ...state, mobileStage: "lists" };

    case "LISTS_LOADED":
      return state.selectedListId === null ? { ...state, selectedListId: action.firstListId } : state;

    default:
      return state;
  }
}

/** Whether the detail pane currently has real content, across every section. */
export function isShowingDetail(screen: Screen): boolean {
  if (screen.section === "lists" || screen.section === "today") {
    return screen.detail.kind !== "none";
  }
  if (screen.section === "settings") {
    return screen.activeSetting !== null;
  }
  if (screen.section === "account") {
    return screen.activeAccountAction !== null;
  }
  return false;
}
