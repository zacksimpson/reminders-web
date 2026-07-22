import { type KeyboardEvent, useState } from "react";
import type { ReminderList } from "./lib/models";
import { addList } from "./lib/store";
import { ListIcon, PlusIcon, SettingsIcon, TodayIcon } from "./icons";

const styles = {
  pane: { padding: "28px 18px" },
  navGroup: { marginBottom: 64 },
  navRow: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: "9px 0",
  },
  navLabel: { fontSize: 17 },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 13 },
  addButton: { display: "flex" },
  listRow: {
    fontSize: 20,
    padding: "6px 0",
    width: "100%",
    textAlign: "left" as const,
  },
  newListInput: {
    fontSize: 20,
    width: "100%",
    borderBottom: "2px solid #fff",
    paddingBottom: 2,
  },
};

export function ListsPane({
  lists,
  selectedListId,
  onSelectList,
  uid,
}: {
  lists: ReminderList[];
  selectedListId: string | null;
  onSelectList: (id: string) => void;
  uid: string;
}) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  async function submitNewList(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setAdding(false);
      setNewTitle("");
      return;
    }
    if (e.key !== "Enter") return;
    const title = newTitle.trim();
    if (title) {
      await addList(uid, title);
    }
    setAdding(false);
    setNewTitle("");
  }

  return (
    <div style={styles.pane}>
      <div style={styles.navGroup}>
        <div style={styles.navRow}>
          <ListIcon />
          <span style={{ ...styles.navLabel, textDecoration: "underline", textUnderlineOffset: 3 }}>
            Lists
          </span>
        </div>
        <div style={styles.navRow}>
          <TodayIcon />
          <span style={styles.navLabel}>Today</span>
        </div>
        <div style={styles.navRow}>
          <SettingsIcon />
          <span style={styles.navLabel}>Settings</span>
        </div>
      </div>

      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>Your lists</span>
        <button
          type="button"
          style={styles.addButton}
          aria-label="Add list"
          onClick={() => setAdding(true)}
        >
          <PlusIcon />
        </button>
      </div>

      {lists.map((list) => (
        <button
          key={list.id}
          type="button"
          style={{
            ...styles.listRow,
            textDecoration: list.id === selectedListId ? "underline" : "none",
            textUnderlineOffset: 4,
          }}
          onClick={() => onSelectList(list.id)}
        >
          {list.title}
        </button>
      ))}

      {adding && (
        <input
          style={styles.newListInput}
          autoFocus
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={submitNewList}
          onBlur={() => {
            setAdding(false);
            setNewTitle("");
          }}
        />
      )}
    </div>
  );
}
