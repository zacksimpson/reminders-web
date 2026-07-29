import { type KeyboardEvent, useRef, useState } from "react";
import { digitsToTime, timeToDisplayParts } from "./lib/dateTime";

const styles = {
  row: { display: "inline-flex", alignItems: "baseline" },
  hour: {
    fontSize: 23,
    background: "none",
    border: "none",
    padding: 0,
    width: "1.2em",
    textAlign: "right" as const,
  },
  minute: {
    fontSize: 23,
    background: "none",
    border: "none",
    padding: 0,
    width: "1.2em",
    textAlign: "left" as const,
  },
  colon: { fontSize: 23 },
  ampm: {
    fontSize: 23,
    background: "none",
    border: "none",
    padding: 0,
    marginLeft: 8,
  },
};

/**
 * Three independently-focusable segments (hour, minute, AM/PM) — visually and
 * behaviorally matching the native `<input type="time">` this replaces, but
 * without its per-segment auto-advance TIMER (the source of the original
 * unreliable-typing bug). Advancing to the next segment is instead decided
 * deterministically: a segment auto-advances the moment its value can no
 * longer be extended (e.g. hour "2".."9" can't become a two-digit hour, so it
 * advances immediately; hour "1" waits for one more keystroke, and if that
 * keystroke can't extend it (3-9), "1" is finalized and the keystroke is
 * routed into the minute segment instead of being dropped).
 */
export function TimeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (time24: string) => void;
}) {
  const initial = timeToDisplayParts(value);
  const [hour, setHour] = useState(initial.digits.slice(0, 2));
  const [minute, setMinute] = useState(initial.digits.slice(2));
  const [ampm, setAmpm] = useState<"AM" | "PM">(initial.ampm);
  const hourRef = useRef<HTMLInputElement>(null);
  const minuteRef = useRef<HTMLInputElement>(null);
  const ampmRef = useRef<HTMLButtonElement>(null);

  function commitIfComplete(h: string, m: string, ap: "AM" | "PM") {
    if (h.length === 2 && m.length === 2) {
      onChange(digitsToTime(h + m, ap));
    }
  }

  function focusMinute() {
    minuteRef.current?.focus();
    minuteRef.current?.select();
  }

  function finishHour(h: string) {
    setHour(h);
    commitIfComplete(h, minute, ampm);
    focusMinute();
  }

  function startMinuteWithDigit(d: string) {
    setMinute(/[0-5]/.test(d) ? d : "");
  }

  function onHourKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      const d = e.key;
      // A full segment already shown (idle display, or just-completed) means
      // the next digit starts a fresh entry rather than extending it.
      const current = hour.length === 2 ? "" : hour;
      if (current === "") {
        if (d === "0") {
          setHour("0");
        } else if (d === "1") {
          setHour("1");
        } else {
          finishHour(`0${d}`);
        }
      } else if (current === "0") {
        if (d !== "0") {
          finishHour(`0${d}`);
        }
      } else if (current === "1") {
        if (d === "0" || d === "1" || d === "2") {
          finishHour(`1${d}`);
        } else {
          setHour("01");
          commitIfComplete("01", minute, ampm);
          focusMinute();
          startMinuteWithDigit(d);
        }
      }
    } else if (e.key === "Backspace") {
      e.preventDefault();
      setHour((h) => h.slice(0, -1));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusMinute();
    }
  }

  function onMinuteKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      const d = e.key;
      const current = minute.length === 2 ? "" : minute;
      if (current === "") {
        if (/[0-5]/.test(d)) {
          setMinute(d);
        }
      } else {
        const m = current + d;
        setMinute(m);
        commitIfComplete(hour, m, ampm);
        ampmRef.current?.focus();
      }
    } else if (e.key === "Backspace") {
      e.preventDefault();
      if (minute === "") {
        hourRef.current?.focus();
        hourRef.current?.select();
      } else {
        setMinute((m) => m.slice(0, -1));
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      hourRef.current?.focus();
      hourRef.current?.select();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      ampmRef.current?.focus();
    }
  }

  function setAmpmAndCommit(ap: "AM" | "PM") {
    setAmpm(ap);
    commitIfComplete(hour, minute, ap);
  }

  function onAmpmKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "a" || e.key === "A") {
      setAmpmAndCommit("AM");
    } else if (e.key === "p" || e.key === "P") {
      setAmpmAndCommit("PM");
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      setAmpmAndCommit(ampm === "AM" ? "PM" : "AM");
    } else if (e.key === "Backspace" || e.key === "ArrowLeft") {
      e.preventDefault();
      minuteRef.current?.focus();
      minuteRef.current?.select();
    }
  }

  return (
    <div style={styles.row}>
      <input
        ref={hourRef}
        type="text"
        inputMode="numeric"
        aria-label="Hour"
        style={styles.hour}
        value={hour}
        onFocus={(e) => e.target.select()}
        onChange={() => {
          // Value is fully driven by onKeyDown; ignore native input events
          // (e.g. autofill) that don't go through it.
        }}
        onKeyDown={onHourKeyDown}
      />
      <span style={styles.colon}>:</span>
      <input
        ref={minuteRef}
        type="text"
        inputMode="numeric"
        aria-label="Minute"
        style={styles.minute}
        value={minute}
        onFocus={(e) => e.target.select()}
        onChange={() => {
          // Value is fully driven by onKeyDown; ignore native input events.
        }}
        onKeyDown={onMinuteKeyDown}
      />
      <button
        ref={ampmRef}
        type="button"
        data-typing-target="true"
        style={styles.ampm}
        onClick={() => setAmpmAndCommit(ampm === "AM" ? "PM" : "AM")}
        onKeyDown={onAmpmKeyDown}
      >
        {ampm}
      </button>
    </div>
  );
}
