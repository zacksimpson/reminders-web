import { useState } from "react";
import { BackButton } from "./BackButton";

// Design reference only — not wired to real config parsing or Firebase
// connection logic yet. Parked here (unlinked route) in case bring-your-own-
// backend gets built out later. See conversation history for the mockup
// this was translated from.

const styles = {
  page: {
    minHeight: "100%",
    display: "flex",
    flexDirection: "column" as const,
    padding: "48px 22px",
    maxWidth: 480,
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    marginBottom: 44,
    minHeight: 26,
  },
  progressTrack: {
    display: "flex",
    gap: 6,
    flex: 1,
  },
  progressSeg: {
    flex: 1,
    height: 4,
    border: "1px solid #fff",
  },
  stepCount: {
    fontSize: 13,
    minWidth: 20,
    textAlign: "right" as const,
  },
  title: {
    fontSize: 32,
    margin: "0 0 20px",
    fontWeight: 400,
  },
  body: {
    fontSize: 16,
    lineHeight: 1.6,
    maxWidth: 420,
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    marginBottom: 4,
  },
  field: {
    marginBottom: 26,
  },
  input: {
    width: "100%",
    fontSize: 22,
    paddingBottom: 6,
    paddingLeft: 0,
    borderBottom: "2px solid #fff",
  },
  codeBox: {
    border: "2px solid #fff",
    padding: "12px 14px",
    fontFamily: "ui-monospace, Menlo, monospace",
    fontSize: 13,
    lineHeight: 1.6,
    whiteSpace: "pre" as const,
    marginBottom: 16,
    overflowX: "auto" as const,
  },
  action: {
    fontSize: 20,
    fontWeight: 400,
    letterSpacing: "0.15em",
    marginTop: 36,
    textAlign: "left" as const,
    alignSelf: "flex-start" as const,
  },
  small: {
    fontSize: 14,
    marginBottom: 8,
  },
};

const SECURITY_RULE = `rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid}/{doc=**} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}`;

type Screen = "landing" | "step1" | "step2" | "step3" | "step4" | "done";
const ORDER: Screen[] = ["landing", "step1", "step2", "step3", "step4", "done"];

function TopBar({
  step,
  total,
  onBack,
}: {
  step: number;
  total: number;
  onBack?: () => void;
}) {
  return (
    <div style={styles.topBar}>
      {onBack ? <BackButton onBack={onBack} /> : <div style={{ width: 16 }} />}
      {total > 0 && (
        <div style={styles.progressTrack}>
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              style={{ ...styles.progressSeg, background: i < step ? "#fff" : "transparent" }}
            />
          ))}
        </div>
      )}
      <div style={styles.stepCount}>{total > 0 ? `${step}/${total}` : ""}</div>
    </div>
  );
}

export function ConnectBackendPreview() {
  const [screen, setScreen] = useState<Screen>("landing");

  function goNext() {
    const idx = ORDER.indexOf(screen);
    setScreen(ORDER[Math.min(idx + 1, ORDER.length - 1)]);
  }

  function goBack() {
    const idx = ORDER.indexOf(screen);
    setScreen(ORDER[Math.max(idx - 1, 0)]);
  }

  if (screen === "landing") {
    return (
      <div style={styles.page}>
        <TopBar step={0} total={0} />
        <div style={styles.title}>Connect a backend</div>
        <div style={styles.body}>
          This site doesn't run its own server. Connect your own free Firebase project so your
          reminders sync privately, just for you.
        </div>
        <div style={{ ...styles.small, marginTop: 24 }}>Already connected before?</div>
        <input style={styles.input} placeholder="Paste your connection link" />
        <button type="button" style={styles.action} onClick={goNext}>
          SET UP A NEW PROJECT
        </button>
      </div>
    );
  }

  if (screen === "step1") {
    return (
      <div style={styles.page}>
        <TopBar step={1} total={4} onBack={goBack} />
        <div style={styles.title}>Create a Firebase project</div>
        <div style={styles.body}>
          Go to console.firebase.google.com and create a new project. The free Spark plan is all
          you need, no card required.
        </div>
        <button type="button" style={styles.action} onClick={goNext}>
          NEXT
        </button>
      </div>
    );
  }

  if (screen === "step2") {
    return (
      <div style={styles.page}>
        <TopBar step={2} total={4} onBack={goBack} />
        <div style={styles.title}>Turn on email sign-in</div>
        <div style={styles.body}>
          In your project, go to Authentication then Sign-in method, and enable Email/Password.
        </div>
        <button type="button" style={styles.action} onClick={goNext}>
          NEXT
        </button>
      </div>
    );
  }

  if (screen === "step3") {
    return (
      <div style={styles.page}>
        <TopBar step={3} total={4} onBack={goBack} />
        <div style={styles.title}>Turn on Firestore</div>
        <div style={styles.body}>
          Enable Firestore, then paste this into its rules so only you can read or write your own
          data:
        </div>
        <div style={styles.codeBox}>{SECURITY_RULE}</div>
        <button type="button" style={styles.action} onClick={goNext}>
          NEXT
        </button>
      </div>
    );
  }

  if (screen === "step4") {
    return (
      <div style={styles.page}>
        <TopBar step={4} total={4} onBack={goBack} />
        <div style={styles.title}>Add your config</div>
        <div style={styles.body}>
          In Project settings, add a Web App, then copy its config values here.
        </div>
        {["API key", "Auth domain", "Project ID", "Storage bucket", "Messaging sender ID", "App ID"].map(
          (label) => (
            <div style={styles.field} key={label}>
              <div style={styles.label}>{label}</div>
              <input style={styles.input} />
            </div>
          )
        )}
        <button type="button" style={styles.action} onClick={goNext}>
          CONNECT
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <TopBar step={0} total={0} />
      <div style={styles.title}>Connected</div>
      <div style={styles.body}>Your reminders now sync to your own Firebase project.</div>
      <div style={styles.small}>
        Bookmark this to reconnect on another device, without retyping anything:
      </div>
      <div style={styles.codeBox}>https://reminders-tool.dev/connect#eyJhcGlLZXk...</div>
      <button type="button" style={styles.action} onClick={() => setScreen("landing")}>
        OPEN YOUR REMINDERS
      </button>
    </div>
  );
}
