import { type KeyboardEvent, useRef, useState } from "react";
import { digitsToTime, timeToDisplayParts } from "./lib/dateTime";

const styles = {
  row: { display: "inline-flex", alignItems: "baseline" },
  hour: {
    fontSize: 23,
    fontVariantNumeric: "tabular-nums" as const,
    background: "none",
    border: "none",
    padding: "1px 1px",
    width: 35,
    textAlign: "left" as const,
  },
  minute: {
    fontSize: 23,
    fontVariantNumeric: "tabular-nums" as const,
    background: "none",
    border: "none",
    padding: "1px 1px",
    width: 35,
    textAlign: "left" as const,
  },
  colon: { fontSize: 23 },
  ampm: {
    fontSize: 23,
    background: "none",
    border: "none",
    padding: "1px 3px",
    marginLeft: 4,
    color: "#fff",
  },
  ampmFocused: {
    background: "#fff",
    color: "#000",
  },
};

// Three segments (hour, minute, AM/PM), each its own input. Auto-advance is
// based on whether a segment's value could still be extended, not a timer,
// so a stray keystroke never gets dropped waiting on a clock.
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
  const [ampmFocused, setAmpmFocused] = useState(false);
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
      // a full segment means the next digit starts over, not extends
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
          // onKeyDown handles everything; this is just to silence React's controlled-input warning
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
          // onKeyDown handles everything; this is just to silence React's controlled-input warning
        }}
        onKeyDown={onMinuteKeyDown}
      />
      <button
        ref={ampmRef}
        type="button"
        data-typing-target="true"
        style={ampmFocused ? { ...styles.ampm, ...styles.ampmFocused } : styles.ampm}
        onClick={() => setAmpmAndCommit(ampm === "AM" ? "PM" : "AM")}
        onFocus={() => setAmpmFocused(true)}
        onBlur={() => setAmpmFocused(false)}
        onKeyDown={onAmpmKeyDown}
      >
        {ampm}
      </button>
    </div>
  );
}
