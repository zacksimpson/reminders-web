import { type KeyboardEvent, useState } from "react";
import type { ReminderList } from "./lib/models";
import { addList } from "./lib/store";
import { AccountIcon, AddTaskIcon, PlusIcon, SettingsIcon, TodayIcon } from "./icons";
import { ScrollPane } from "./ScrollPane";

const SIDE_PADDING = { paddingLeft: 20, paddingRight: 28 };
const NAV_GAP = 72;

const styles = {
  pane: {
    height: "100%",
    minHeight: 0,
    display: "flex",
    flexDirection: "column" as const,
    padding: "30px 0",
  },
  navZone: { ...SIDE_PADDING, flexShrink: 0, marginBottom: NAV_GAP },
  navRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    width: "100%",
    textAlign: "left" as const,
  },
  navLabel: { fontSize: 19 },
  scrollZoneOuter: { flex: 1, minHeight: 0 },
  scrollZoneInner: SIDE_PADDING,
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
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  newListInput: {
    fontSize: 23,
    width: "100%",
    borderBottom: "2px solid #fff",
    paddingBottom: 2,
  },
  accountZone: { ...SIDE_PADDING, flexShrink: 0, marginTop: NAV_GAP },
};

type Section = "lists" | "today" | "settings" | "account" | "add";
// Every nav button here selects a fixed section directly (never "lists" —
// that only happens by picking an actual list, via onSelectList instead).
type SelectableSection = Exclude<Section, "lists">;

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
  section: Section;
  onSelectSection: (section: SelectableSection) => void;
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
      <div style={styles.navZone}>
        <button type="button" style={styles.navRow} onClick={() => onSelectSection("add")}>
          <AddTaskIcon />
          <span
            style={{
              ...styles.navLabel,
              textDecoration: section === "add" ? "underline" : "none",
              textUnderlineOffset: 3,
            }}
          >
            Add Task
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

      <ScrollPane style={styles.scrollZoneInner} outerStyle={styles.scrollZoneOuter}>
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

      <div style={styles.accountZone}>
        <button type="button" style={styles.navRow} onClick={() => onSelectSection("account")}>
          <AccountIcon />
          <span
            style={{
              ...styles.navLabel,
              textDecoration: section === "account" ? "underline" : "none",
              textUnderlineOffset: 3,
            }}
          >
            Account
          </span>
        </button>
      </div>
    </div>
  );
}
