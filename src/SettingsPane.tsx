import { BackButton } from "./BackButton";
import { ScrollPane } from "./ScrollPane";

const styles = {
  pane: { padding: "30px 24px" },
  headerTitle: { fontSize: 32, fontWeight: 400, marginBottom: 26 },
  headerMobile: {
    textAlign: "center" as const,
    fontSize: 23,
    marginBottom: 26,
    position: "relative" as const,
  },
  backButtonMobile: { position: "absolute" as const, left: 0, top: 3 },
  row: {
    width: "100%",
    textAlign: "left" as const,
    padding: "13px 0",
  },
  rowValue: { fontSize: 23 },
};

export type SettingKey = "today-view" | "task-behaviors" | "notifications" | "import-backup";

export type TaskBehaviorKey = "default-list" | "after-quick-add" | "add-position";

export function SettingsPane({
  activeSetting,
  onSelectSetting,
  onBack,
}: {
  activeSetting: SettingKey | null;
  onSelectSetting: (key: SettingKey) => void;
  onBack?: () => void;
}) {
  return (
    <ScrollPane style={styles.pane}>
      {onBack ? (
        <div style={styles.headerMobile}>
          <BackButton onBack={onBack} style={styles.backButtonMobile} />
          Settings
        </div>
      ) : (
        <div style={styles.headerTitle}>Settings</div>
      )}

      <button
        type="button"
        style={{ ...styles.row, textDecoration: activeSetting === "notifications" ? "underline" : "none" }}
        onClick={() => onSelectSetting("notifications")}
      >
        <div style={styles.rowValue}>Notifications</div>
      </button>

      <button
        type="button"
        style={{ ...styles.row, textDecoration: activeSetting === "task-behaviors" ? "underline" : "none" }}
        onClick={() => onSelectSetting("task-behaviors")}
      >
        <div style={styles.rowValue}>Task Behaviors</div>
      </button>

      <button
        type="button"
        style={{ ...styles.row, textDecoration: activeSetting === "today-view" ? "underline" : "none" }}
        onClick={() => onSelectSetting("today-view")}
      >
        <div style={styles.rowValue}>Today View</div>
      </button>

      <button
        type="button"
        style={{ ...styles.row, textDecoration: activeSetting === "import-backup" ? "underline" : "none" }}
        onClick={() => onSelectSetting("import-backup")}
      >
        <div style={styles.rowValue}>Import Backup</div>
      </button>
    </ScrollPane>
  );
}
