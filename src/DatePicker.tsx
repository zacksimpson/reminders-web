import { useEffect, useRef, useState } from "react";
import { MONTHS, formatDisplayDate } from "./lib/dateTime";
import { BackChevronIcon, ChevronDownIcon } from "./icons";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const styles = {
  wrapper: { position: "relative" as const, display: "inline-block" },
  trigger: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "none",
    border: "none",
    padding: 0,
  },
  value: { fontSize: 23 },
  chevron: { display: "flex", marginTop: 3 },
  panel: {
    position: "absolute" as const,
    top: "100%",
    left: 0,
    marginTop: 10,
    border: "1px solid #fff",
    background: "#000",
    zIndex: 20,
    padding: "18px 20px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 14,
  },
  monthLabel: { fontSize: 17, whiteSpace: "nowrap" as const },
  navButton: { display: "flex", padding: 6 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 32px)",
  },
  weekdayCell: { fontSize: 12, fontWeight: 700, textAlign: "center" as const, padding: "4px 0" },
  dayCell: {
    fontSize: 15,
    textAlign: "center" as const,
    padding: "8px 0",
    width: "100%",
  },
};

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function DatePicker({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const baseDate = value ? new Date(`${value}T00:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(baseDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(baseDate.getMonth());

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(e: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function openPicker() {
    const base = value ? new Date(`${value}T00:00:00`) : new Date();
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setOpen(true);
  }

  function goToPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function selectDay(day: number) {
    onChange(`${viewYear}-${pad2(viewMonth + 1)}-${pad2(day)}`);
    setOpen(false);
  }

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = daysInMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return (
    <div ref={wrapperRef} style={styles.wrapper}>
      <button type="button" style={styles.trigger} onClick={() => (open ? setOpen(false) : openPicker())}>
        <span style={styles.value}>{value ? formatDisplayDate(value) : "None"}</span>
        <span style={styles.chevron}>
          <ChevronDownIcon size={13} />
        </span>
      </button>
      {open && (
        <div style={styles.panel}>
          <div style={styles.header}>
            <button type="button" style={styles.navButton} onClick={goToPrevMonth} aria-label="Previous month">
              <BackChevronIcon size={14} />
            </button>
            <span style={styles.monthLabel}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" style={styles.navButton} onClick={goToNextMonth} aria-label="Next month">
              <span style={{ display: "flex", transform: "scaleX(-1)" }}>
                <BackChevronIcon size={14} />
              </span>
            </button>
          </div>
          <div style={styles.grid}>
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={`weekday-${i}`} style={styles.weekdayCell}>
                {label}
              </div>
            ))}
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={i} />;
              }
              const iso = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(day)}`;
              const selected = value === iso;
              return (
                <button
                  key={i}
                  type="button"
                  style={{
                    ...styles.dayCell,
                    textDecoration: selected ? "underline" : "none",
                    textUnderlineOffset: 3,
                  }}
                  onClick={() => selectDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
