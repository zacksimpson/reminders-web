// Matches components/ToggleSwitch.tsx in the phone app exactly: two plain
// shapes (a line + a circle), not a pill switch. ON renders line-then-filled-
// circle; OFF renders hollow-circle-then-line — the order flips, it isn't
// just a fill/stroke swap. Whole row is tappable, optional description
// subtitle below the label.

const CIRCLE_DIAMETER = 16;
const CIRCLE_BORDER = 2;
const LINE_WIDTH = 24;
const LINE_HEIGHT = 2;

const styles = {
  row: {
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
    width: "100%",
    textAlign: "left" as const,
    padding: "10px 0",
  },
  graphic: { marginTop: 5, flexShrink: 0, display: "flex", alignItems: "center" },
  line: { width: LINE_WIDTH, height: LINE_HEIGHT, background: "#fff" },
  filledCircle: { width: CIRCLE_DIAMETER, height: CIRCLE_DIAMETER, borderRadius: "50%", background: "#fff" },
  hollowCircle: {
    width: CIRCLE_DIAMETER,
    height: CIRCLE_DIAMETER,
    borderRadius: "50%",
    border: `${CIRCLE_BORDER}px solid #fff`,
  },
  label: { fontSize: 23 },
  description: { fontSize: 15, marginTop: 4 },
};

function ToggleGraphic({ on }: { on: boolean }) {
  return (
    <div style={styles.graphic}>
      {on ? (
        <>
          <div style={styles.line} />
          <div style={styles.filledCircle} />
        </>
      ) : (
        <>
          <div style={styles.hollowCircle} />
          <div style={styles.line} />
        </>
      )}
    </div>
  );
}

export function ToggleSwitch({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <button type="button" style={styles.row} onClick={() => onValueChange(!value)}>
      <ToggleGraphic on={value} />
      <div>
        <div style={styles.label}>{label}</div>
        {description && <div style={styles.description}>{description}</div>}
      </div>
    </button>
  );
}
