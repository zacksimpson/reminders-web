import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "reminders-web:paneWidths";

// Below this, "Add Task" (the widest nav label) wraps to a second line and
// the SVG nav icons visibly shrink — measured the actual rendered label
// width and picked the smallest value that never triggers either.
const LISTS_MIN = 180;
const LISTS_MAX = 320;
const TASKS_MIN = 220;
const TASKS_MAX = 480;
const DEFAULTS = { lists: 320, tasks: 480 };

type Divider = "lists" | "tasks";

function loadWidths() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "");
    const lists = typeof parsed.lists === "number" ? parsed.lists : DEFAULTS.lists;
    const tasks = typeof parsed.tasks === "number" ? parsed.tasks : DEFAULTS.tasks;
    return {
      // Re-clamped on load too, so a width saved before LISTS_MIN/TASKS_MIN
      // changed (or from a stale/edited localStorage value) can't stick.
      lists: Math.min(LISTS_MAX, Math.max(LISTS_MIN, lists)),
      tasks: Math.min(TASKS_MAX, Math.max(TASKS_MIN, tasks)),
    };
  } catch {
    return DEFAULTS;
  }
}

export function useResizablePanes() {
  const [widths, setWidths] = useState(loadWidths);
  const dragRef = useRef<{ divider: Divider; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
  }, [widths]);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const delta = e.clientX - drag.startX;
      if (drag.divider === "lists") {
        const next = Math.min(LISTS_MAX, Math.max(LISTS_MIN, drag.startWidth + delta));
        setWidths((w) => ({ ...w, lists: next }));
      } else {
        const next = Math.min(TASKS_MAX, Math.max(TASKS_MIN, drag.startWidth + delta));
        setWidths((w) => ({ ...w, tasks: next }));
      }
    }
    function onUp() {
      dragRef.current = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  function startDrag(divider: Divider) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = { divider, startX: e.clientX, startWidth: widths[divider] };
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    };
  }

  return { widths, startDrag };
}
