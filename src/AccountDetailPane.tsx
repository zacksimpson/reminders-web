import { EmailAuthProvider, deleteUser, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { useState } from "react";
import { auth } from "./firebase";
import { deleteAllUserData } from "./lib/store";
import { BackButton } from "./BackButton";
import { ScrollPane } from "./ScrollPane";
import type { AccountKey } from "./AccountPane";

const styles = {
  pane: { padding: "30px 37px", maxWidth: 720 },
  backRow: { marginBottom: 20 },
  title: { fontSize: 32, marginBottom: 26, fontWeight: 400 },
  body: { fontSize: 16, lineHeight: 1.6, marginBottom: 30 },
  field: { marginBottom: 26 },
  label: { fontSize: 15, marginBottom: 4 },
  input: {
    width: "100%",
    fontSize: 23,
    paddingBottom: 8,
    borderBottom: "2px solid #fff",
  },
  action: {
    fontSize: 20,
    fontWeight: 400,
    letterSpacing: "0.15em",
    textAlign: "left" as const,
  },
  status: { fontSize: 16, marginTop: 24 },
};

export function AccountDetailPane({
  activeAccountAction,
  onBack,
}: {
  activeAccountAction: AccountKey | null;
  onBack?: () => void;
}) {
  if (activeAccountAction === null) {
    return <div style={styles.pane} />;
  }

  const backRow = onBack && (
    <div style={styles.backRow}>
      <BackButton onBack={onBack} />
    </div>
  );

  if (activeAccountAction === "change-password") {
    return (
      <ScrollPane style={styles.pane}>
        {backRow}
        <div style={styles.title}>Change Password</div>
        <ChangePasswordSection />
      </ScrollPane>
    );
  }

  return (
    <ScrollPane style={styles.pane}>
      {backRow}
      <div style={styles.title}>Delete Account</div>
      <DeleteAccountSection />
    </ScrollPane>
  );
}

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    if (busy) return;
    setStatus(null);
    if (newPassword.length < 6) {
      setStatus("New password must be at least 6 characters.");
      return;
    }
    const user = auth.currentUser;
    if (!user?.email) return;
    setBusy(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setStatus("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div style={styles.field}>
        <div style={styles.label}>Current Password</div>
        <input
          type="password"
          style={styles.input}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>
      <div style={styles.field}>
        <div style={styles.label}>New Password</div>
        <input
          type="password"
          style={styles.input}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      <button type="button" style={styles.action} disabled={busy} onClick={handleSave}>
        {busy ? "SAVING…" : "SAVE"}
      </button>
      {status && <div style={styles.status}>{status}</div>}
    </>
  );
}

function DeleteAccountSection() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (busy) return;
    setStatus(null);
    const user = auth.currentUser;
    if (!user?.email) return;
    setBusy(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await deleteAllUserData(user.uid);
      await deleteUser(user);
      // onAuthStateChanged in App.tsx picks up the sign-out and redirects to AuthScreen.
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <>
      <div style={styles.body}>
        This permanently deletes your account and all of your reminders. This can't be undone.
      </div>
      <div style={styles.field}>
        <div style={styles.label}>Password</div>
        <input
          type="password"
          style={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="button" style={styles.action} disabled={busy} onClick={handleDelete}>
        {busy ? "DELETING…" : "DELETE"}
      </button>
      {status && <div style={styles.status}>{status}</div>}
    </>
  );
}
