import type { ReminderList, Settings } from "./lib/models";
import { BackButton } from "./BackButton";

const styles = {
  pane: { padding: "30px 24px" },
  header: {
    textAlign: "center" as const,
    fontSize: 23,
    marginBottom: 26,
    position: "relative" as const,
  },
  backButton: { position: "absolute" as const, left: 0, top: 3 },
  row: {
    width: "100%",
    textAlign: "left" as const,
    padding: "13px 0",
  },
  rowLabel: { fontSize: 15, marginBottom: 3 },
  rowValue: { fontSize: 23 },
};

const AFTER_QUICK_ADD_LABELS: Record<Settings["afterAddBehavior"], string> = {
  toast: "Add Next",
  "go-to-list": "Go to List",
};

const ADD_POSITION_LABELS: Record<Settings["addPosition"], string> = {
  top: "Top of List",
  bottom: "Bottom of List",
};

export type SettingKey = "today-view" | "default-list" | "after-quick-add" | "add-position" | "import-backup";

export function SettingsPane({
  lists,
  settings,
  activeSetting,
  onSelectSetting,
  onBack,
}: {
  lists: ReminderList[];
  settings: Settings;
  activeSetting: SettingKey | null;
  onSelectSetting: (key: SettingKey) => void;
  onBack?: () => void;
}) {
  const defaultListTitle = lists.find((l) => l.id === settings.defaultListId)?.title ?? "Inbox";

  return (
    <div style={styles.pane}>
      <div style={styles.header}>
        {onBack && <BackButton onBack={onBack} style={styles.backButton} />}
        Settings
      </div>

      <button
        type="button"
        style={{ ...styles.row, textDecoration: activeSetting === "today-view" ? "underline" : "none" }}
        onClick={() => onSelectSetting("today-view")}
      >
        <div style={styles.rowValue}>Today View</div>
      </button>

      <button
        type="button"
        style={{ ...styles.row, textDecoration: activeSetting === "default-list" ? "underline" : "none" }}
        onClick={() => onSelectSetting("default-list")}
      >
        <div style={styles.rowLabel}>Default List</div>
        <div style={styles.rowValue}>{defaultListTitle}</div>
      </button>

      <button
        type="button"
        style={{ ...styles.row, textDecoration: activeSetting === "after-quick-add" ? "underline" : "none" }}
        onClick={() => onSelectSetting("after-quick-add")}
      >
        <div style={styles.rowLabel}>After Quick Add</div>
        <div style={styles.rowValue}>{AFTER_QUICK_ADD_LABELS[settings.afterAddBehavior]}</div>
      </button>

      <button
        type="button"
        style={{ ...styles.row, textDecoration: activeSetting === "add-position" ? "underline" : "none" }}
        onClick={() => onSelectSetting("add-position")}
      >
        <div style={styles.rowLabel}>Add New Tasks</div>
        <div style={styles.rowValue}>{ADD_POSITION_LABELS[settings.addPosition]}</div>
      </button>

      <button
        type="button"
        style={{ ...styles.row, textDecoration: activeSetting === "import-backup" ? "underline" : "none" }}
        onClick={() => onSelectSetting("import-backup")}
      >
        <div style={styles.rowValue}>Import Backup</div>
      </button>
    </div>
  );
}
