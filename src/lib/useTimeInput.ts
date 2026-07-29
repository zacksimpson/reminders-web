import { type ChangeEvent, type FocusEvent, type KeyboardEvent, useRef, useState } from "react";
import { digitsToTime, formatTime, timeToDisplayParts } from "./dateTime";

/**
 * Props for a plain text `<input>` that lets the user type a time freely
 * (e.g. "145p", "1:45 PM", "1:45pm") instead of using the native
 * `<input type="time">` segmented widget, whose per-segment auto-advance
 * timing makes fast two-digit entry unreliable. Digits are parsed on commit
 * (blur/Enter), not per keystroke, so there's no timing race. Focusing the
 * field selects the current value (rather than clearing it) so typing a
 * fresh time still just types over it, but the existing value stays visible
 * until you do.
 */
export function useTimeInput(value: string, onChange: (time24: string) => void) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  const cancelledRef = useRef(false);

  function commit() {
    const digits = raw.replace(/[^0-9]/g, "").slice(0, 4);
    if (digits.length === 3 || digits.length === 4) {
      const h = digits.length === 3 ? Number(digits[0]) : Number(digits.slice(0, 2));
      const m = Number(digits.length === 3 ? digits.slice(1) : digits.slice(2));
      if (h >= 1 && h <= 12 && m >= 0 && m <= 59) {
        const typedPm = /p/i.test(raw);
        const typedAm = /a/i.test(raw);
        const ampm = typedPm ? "PM" : typedAm ? "AM" : timeToDisplayParts(value).ampm;
        onChange(digitsToTime(digits, ampm));
      }
    }
    setEditing(false);
    setRaw("");
  }

  return {
    value: editing ? raw : formatTime(value),
    onFocus: (e: FocusEvent<HTMLInputElement>) => {
      cancelledRef.current = false;
      setEditing(true);
      setRaw(formatTime(value));
      const el = e.target;
      // Re-rendering with the (unchanged) value resets the cursor to the end,
      // even though the string is identical — select after that render commits.
      setTimeout(() => el.select(), 0);
    },
    onChange: (e: ChangeEvent<HTMLInputElement>) => setRaw(e.target.value),
    onBlur: () => {
      if (cancelledRef.current) {
        cancelledRef.current = false;
        return;
      }
      commit();
    },
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        (e.target as HTMLInputElement).blur();
      } else if (e.key === "Escape") {
        cancelledRef.current = true;
        setEditing(false);
        setRaw("");
        (e.target as HTMLInputElement).blur();
      }
    },
  };
}
