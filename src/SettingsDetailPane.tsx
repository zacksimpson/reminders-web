import { type ChangeEvent, useRef, useState } from "react";
import type { ReminderList, Settings } from "./lib/models";
import { importBackup, parseBackupFile, updateSettings } from "./lib/store";
import { ToggleSwitch } from "./ToggleSwitch";
import { BackButton } from "./BackButton";
import { ScrollPane } from "./ScrollPane";
import { TimeField } from "./TimeField";
import type { SettingKey, TaskBehaviorKey } from "./SettingsPane";
import type { BrowserNotificationsApi } from "./useBrowserNotifications";

const AFTER_QUICK_ADD_LABELS: Record<Settings["afterAddBehavior"], string> = {
  toast: "Add Next",
  "go-to-list": "Go to List",
};

const ADD_POSITION_LABELS: Record<Settings["addPosition"], string> = {
  top: "Top of List",
  bottom: "Bottom of List",
};

const styles = {
  pane: { padding: "30px 37px", maxWidth: 720 },
  backRow: { marginBottom: 20 },
  title: {
    fontSize: 32,
    marginBottom: 26,
    fontWeight: 400,
  },
  option: {
    width: "100%",
    textAlign: "left" as const,
    fontSize: 23,
    padding: "10px 0",
  },
  row: {
    width: "100%",
    textAlign: "left" as const,
    padding: "13px 0",
  },
  rowLabel: { fontSize: 15, marginBottom: 3 },
  rowValue: { fontSize: 23 },
  body: {
    fontSize: 16,
    lineHeight: 1.6,
    marginBottom: 30,
  },
  action: {
    fontSize: 20,
    fontWeight: 400,
    letterSpacing: "0.15em",
    textAlign: "left" as const,
  },
  status: {
    fontSize: 16,
    marginTop: 24,
  },
  field: { marginTop: 26 },
  fieldLabel: { fontSize: 15, marginBottom: 4 },
};

export function SettingsDetailPane({
  uid,
  lists,
  settings,
  activeSetting,
  activeTaskBehavior,
  notifications,
  onSelectTaskBehavior,
  onBackFromTaskBehavior,
  onBack,
}: {
  uid: string;
  lists: ReminderList[];
  settings: Settings;
  activeSetting: SettingKey | null;
  activeTaskBehavior: TaskBehaviorKey | null;
  notifications: BrowserNotificationsApi;
  onSelectTaskBehavior: (key: TaskBehaviorKey) => void;
  onBackFromTaskBehavior: () => void;
  onBack?: () => void;
}) {
  if (activeSetting === null) {
    return <div style={styles.pane} />;
  }

  const backRow = onBack && (
    <div style={styles.backRow}>
      <BackButton onBack={onBack} />
    </div>
  );

  const taskBehaviorBackRow = (
    <div style={styles.backRow}>
      <BackButton onBack={onBackFromTaskBehavior} />
    </div>
  );

  if (activeSetting === "task-behaviors") {
    const defaultListTitle = lists.find((l) => l.id === settings.defaultListId)?.title ?? "Inbox";

    if (activeTaskBehavior === null) {
      return (
        <ScrollPane style={styles.pane}>
          {backRow}
          <div style={styles.title}>Task Behaviors</div>

          <button type="button" style={styles.row} onClick={() => onSelectTaskBehavior("default-list")}>
            <div style={styles.rowLabel}>Default List</div>
            <div style={styles.rowValue}>{defaultListTitle}</div>
          </button>

          <button type="button" style={styles.row} onClick={() => onSelectTaskBehavior("after-quick-add")}>
            <div style={styles.rowLabel}>After Quick Add</div>
            <div style={styles.rowValue}>{AFTER_QUICK_ADD_LABELS[settings.afterAddBehavior]}</div>
          </button>

          <button type="button" style={styles.row} onClick={() => onSelectTaskBehavior("add-position")}>
            <div style={styles.rowLabel}>Add New Tasks</div>
            <div style={styles.rowValue}>{ADD_POSITION_LABELS[settings.addPosition]}</div>
          </button>
        </ScrollPane>
      );
    }

    if (activeTaskBehavior === "default-list") {
      return (
        <ScrollPane style={styles.pane}>
          {taskBehaviorBackRow}
          <div style={styles.title}>Default List</div>
          {lists.map((list) => (
            <button
              key={list.id}
              type="button"
              style={{
                ...styles.option,
                textDecoration: list.id === settings.defaultListId ? "underline" : "none",
                textUnderlineOffset: 4,
              }}
              onClick={() => updateSettings(uid, { defaultListId: list.id })}
            >
              {list.title}
            </button>
          ))}
        </ScrollPane>
      );
    }

    if (activeTaskBehavior === "after-quick-add") {
      return (
        <ScrollPane style={styles.pane}>
          {taskBehaviorBackRow}
          <div style={styles.title}>After Quick Add</div>
          {(
            [
              { value: "toast", label: "Add Next" },
              { value: "go-to-list", label: "Go to List" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              style={{
                ...styles.option,
                textDecoration: opt.value === settings.afterAddBehavior ? "underline" : "none",
                textUnderlineOffset: 4,
              }}
              onClick={() => updateSettings(uid, { afterAddBehavior: opt.value })}
            >
              {opt.label}
            </button>
          ))}
        </ScrollPane>
      );
    }

    return (
      <ScrollPane style={styles.pane}>
        {taskBehaviorBackRow}
        <div style={styles.title}>Add New Tasks</div>
        {(
          [
            { value: "top", label: "Top of List" },
            { value: "bottom", label: "Bottom of List" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            style={{
              ...styles.option,
              textDecoration: opt.value === settings.addPosition ? "underline" : "none",
              textUnderlineOffset: 4,
            }}
            onClick={() => updateSettings(uid, { addPosition: opt.value })}
          >
            {opt.label}
          </button>
        ))}
      </ScrollPane>
    );
  }

  if (activeSetting === "today-view") {
    return (
      <ScrollPane style={styles.pane}>
        {backRow}
        <div style={styles.title}>Today View</div>
        <ToggleSwitch
          label="Show Overdue"
          description="indicated with *"
          value={settings.showOverdue}
          onValueChange={(v) => updateSettings(uid, { showOverdue: v })}
        />
      </ScrollPane>
    );
  }

  if (activeSetting === "notifications") {
    return (
      <ScrollPane style={styles.pane}>
        {backRow}
        <div style={styles.title}>Notifications</div>
        <NotificationsSection notifications={notifications} />
      </ScrollPane>
    );
  }

  return (
    <ScrollPane style={styles.pane}>
      {backRow}
      <div style={styles.title}>Import Backup</div>
      <ImportBackupSection uid={uid} />
    </ScrollPane>
  );
}

function NotificationsSection({ notifications }: { notifications: BrowserNotificationsApi }) {
  const {
    enabled,
    todaysTasksEnabled,
    todaysTasksTime,
    permissionDenied,
    supported,
    setEnabled,
    setTodaysTasksEnabled,
    setTodaysTasksTime,
  } = notifications;

  if (!supported) {
    return <div style={styles.body}>Notifications aren't supported in this browser.</div>;
  }

  return (
    <>
      <ToggleSwitch label="Enable Notifications" value={enabled} onValueChange={setEnabled} />

      {permissionDenied && (
        <div style={styles.body}>
          Please enable notification permissions for this site in your browser's settings.
        </div>
      )}

      {enabled && (
        <>
          <ToggleSwitch
            label="Today's Tasks"
            value={todaysTasksEnabled}
            onValueChange={setTodaysTasksEnabled}
          />

          {todaysTasksEnabled && (
            <div style={styles.field}>
              <div style={styles.fieldLabel}>Notification Time</div>
              <TimeField value={todaysTasksTime} onChange={setTodaysTasksTime} />
            </div>
          )}

          <div style={{ ...styles.body, ...styles.field }}>
            Notifications only fire while this tab is open in your browser.
          </div>
        </>
      )}
    </>
  );
}

function ImportBackupSection({ uid }: { uid: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const text = await file.text();
      const data = parseBackupFile(text);
      const result = await importBackup(uid, data);
      setStatus(
        `Imported ${result.listsAdded} list${result.listsAdded === 1 ? "" : "s"} and ${result.tasksAdded} task${result.tasksAdded === 1 ? "" : "s"}.`
      );
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div style={styles.body}>
        Reminders from the file that aren't already in your account will be added. Nothing will
        be removed or overwritten.
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={handleFile}
      />
      <button
        type="button"
        style={styles.action}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "IMPORTING…" : "CHOOSE FILE"}
      </button>
      {status && <div style={styles.status}>{status}</div>}
    </>
  );
}
