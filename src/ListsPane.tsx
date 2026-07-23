import { type KeyboardEvent, useState } from "react";
import type { ReminderList } from "./lib/models";
import { addList } from "./lib/store";
import { ListIcon, PlusIcon, SettingsIcon, TodayIcon } from "./icons";
import { ScrollPane } from "./ScrollPane";

const styles = {
  pane: { padding: "30px 28px 30px 20px" },
  navGroup: { marginBottom: 72 },
  navRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    width: "100%",
    textAlign: "left" as const,
  },
  navLabel: { fontSize: 19 },
  sectionHeader: {
    position: "relative" as const,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15 },
  addButton: { position: "absolute" as const, left: 88, top: 1, display: "flex" },
  listRow: {
    fontSize: 23,
    padding: "7px 0",
    width: "100%",
    textAlign: "left" as const,
  },
  newListInput: {
    fontSize: 23,
    width: "100%",
    borderBottom: "2px solid #fff",
    paddingBottom: 2,
  },
};

export function ListsPane({
  lists,
  selectedListId,
  onSelectList,
  section,
  onSelectSection,
  uid,
}: {
  lists: ReminderList[];
  selectedListId: string | null;
  onSelectList: (id: string) => void;
  section: "lists" | "today" | "settings";
  onSelectSection: (section: "lists" | "today" | "settings") => void;
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
    <ScrollPane style={styles.pane}>
      <div style={styles.navGroup}>
        <button type="button" style={styles.navRow} onClick={() => onSelectSection("lists")}>
          <ListIcon />
          <span
            style={{
              ...styles.navLabel,
              textDecoration: section === "lists" ? "underline" : "none",
              textUnderlineOffset: 3,
            }}
          >
            Lists
          </span>
        </button>
        <button type="button" style={styles.navRow} onClick={() => onSelectSection("today")}>
          <TodayIcon />
          <span
            style={{
              ...styles.navLabel,
              textDecoration: section === "today" ? "underline" : "none",
              textUnderlineOffset: 3,
            }}
          >
            Today
          </span>
        </button>
        <button type="button" style={styles.navRow} onClick={() => onSelectSection("settings")}>
          <SettingsIcon />
          <span
            style={{
              ...styles.navLabel,
              textDecoration: section === "settings" ? "underline" : "none",
              textUnderlineOffset: 3,
            }}
          >
            Settings
          </span>
        </button>
      </div>

      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>Your lists</span>
        <button
          type="button"
          style={styles.addButton}
          aria-label="Add list"
          onClick={() => setAdding(true)}
        >
          <PlusIcon size={13} />
        </button>
      </div>

      {lists.map((list) => (
        <button
          key={list.id}
          type="button"
          style={{
            ...styles.listRow,
            textDecoration: section === "lists" && list.id === selectedListId ? "underline" : "none",
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
    </ScrollPane>
  );
}
