import { type ChangeEvent, useRef, useState } from "react";
import type { ReminderList, Settings } from "./lib/models";
import { importBackup, parseBackupFile, updateSettings } from "./lib/store";
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

  if (activeSetting === "add-position") {
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

  return (
    <div style={styles.pane}>
      {backRow}
      <div style={styles.title}>Import Backup</div>
      <ImportBackupSection uid={uid} />
    </div>
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
