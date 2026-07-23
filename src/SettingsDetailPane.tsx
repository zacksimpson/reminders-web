import type { ReminderList, Settings } from "./lib/models";
import { updateSettings } from "./lib/store";
import { ToggleSwitch } from "./ToggleSwitch";
import { BackButton } from "./BackButton";
import type { SettingKey } from "./SettingsPane";

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
};

export function SettingsDetailPane({
  uid,
  lists,
  settings,
  activeSetting,
  onBack,
}: {
  uid: string;
  lists: ReminderList[];
  settings: Settings;
  activeSetting: SettingKey | null;
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

  if (activeSetting === "today-view") {
    return (
      <div style={styles.pane}>
        {backRow}
        <div style={styles.title}>Today View</div>
        <ToggleSwitch
          label="Show Overdue"
          description="indicated with *"
          value={settings.showOverdue}
          onValueChange={(v) => updateSettings(uid, { showOverdue: v })}
        />
      </div>
    );
  }

  if (activeSetting === "default-list") {
    return (
      <div style={styles.pane}>
        {backRow}
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
      </div>
    );
  }

  if (activeSetting === "after-quick-add") {
    return (
      <div style={styles.pane}>
        {backRow}
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
      </div>
    );
  }

  return (
    <div style={styles.pane}>
      {backRow}
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
    </div>
  );
}
