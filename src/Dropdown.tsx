import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "./icons";

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
    minWidth: 180,
    maxHeight: 260,
    overflowY: "auto" as const,
    border: "1px solid #fff",
    background: "#000",
    zIndex: 20,
    padding: "6px 0",
  },
  option: {
    display: "block",
    width: "100%",
    textAlign: "left" as const,
    fontSize: 19,
    padding: "10px 18px",
  },
};

export function Dropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

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

  return (
    <div ref={wrapperRef} style={styles.wrapper}>
      <button type="button" style={styles.trigger} onClick={() => setOpen((v) => !v)}>
        <span style={styles.value}>{selected?.label ?? ""}</span>
        <span style={styles.chevron}>
          <ChevronDownIcon size={13} />
        </span>
      </button>
      {open && (
        <div style={styles.panel}>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              style={{
                ...styles.option,
                textDecoration: o.value === value ? "underline" : "none",
                textUnderlineOffset: 3,
              }}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
