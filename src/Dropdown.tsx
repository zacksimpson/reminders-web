import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "./icons";
import { ScrollPane } from "./ScrollPane";

const TYPEAHEAD_RESET_MS = 800;

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
    minWidth: 200,
    border: "1px solid #fff",
    background: "#000",
    zIndex: 20,
    padding: "10px 0",
  },
  panelScroll: { maxHeight: 260 },
  option: {
    display: "block",
    width: "100%",
    textAlign: "left" as const,
    fontSize: 19,
    padding: "10px 32px 10px 18px",
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
  const [highlighted, setHighlighted] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef(new Map<string, HTMLButtonElement>());
  const highlightedRef = useRef(value);
  const optionsRef = useRef(options);
  const onChangeRef = useRef(onChange);
  const typeaheadBufferRef = useRef("");
  const typeaheadTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const selected = options.find((o) => o.value === value);

  highlightedRef.current = highlighted;
  optionsRef.current = options;
  onChangeRef.current = onChange;

  // Rebuilt as a custom-styled panel (not a native <select>), which loses the
  // browser's own type-to-jump behavior — this restores it: typing jumps the
  // underline to the first option starting with what's typed, Enter confirms.
  useEffect(() => {
    if (!open) {
      return;
    }
    setHighlighted(value);
    typeaheadBufferRef.current = "";

    function onPointerDown(e: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        onChangeRef.current(highlightedRef.current);
        setOpen(false);
        return;
      }
      if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }
      clearTimeout(typeaheadTimeoutRef.current);
      typeaheadBufferRef.current += e.key.toLowerCase();
      typeaheadTimeoutRef.current = setTimeout(() => {
        typeaheadBufferRef.current = "";
      }, TYPEAHEAD_RESET_MS);
      const buffer = typeaheadBufferRef.current;
      const match = optionsRef.current.find((o) => o.label.toLowerCase().startsWith(buffer));
      if (match) {
        setHighlighted(match.value);
        optionRefs.current.get(match.value)?.scrollIntoView({ block: "nearest" });
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      clearTimeout(typeaheadTimeoutRef.current);
    };
  }, [open, value]);

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
          <ScrollPane style={styles.panelScroll}>
            {options.map((o) => (
              <button
                key={o.value}
                ref={(el) => {
                  if (el) {
                    optionRefs.current.set(o.value, el);
                  } else {
                    optionRefs.current.delete(o.value);
                  }
                }}
                type="button"
                style={{
                  ...styles.option,
                  textDecoration: o.value === highlighted ? "underline" : "none",
                  textUnderlineOffset: 3,
                }}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                onMouseEnter={() => setHighlighted(o.value)}
              >
                {o.label}
              </button>
            ))}
          </ScrollPane>
        </div>
      )}
    </div>
  );
}
