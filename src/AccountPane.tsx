import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { BackButton } from "./BackButton";
import { ScrollPane } from "./ScrollPane";

const styles = {
  pane: { padding: "30px 24px" },
  headerTitle: { fontSize: 32, fontWeight: 400, marginBottom: 26 },
  headerMobile: {
    textAlign: "center" as const,
    fontSize: 23,
    marginBottom: 26,
    position: "relative" as const,
  },
  backButtonMobile: { position: "absolute" as const, left: 0, top: 3 },
  email: { fontSize: 16, marginBottom: 30 },
  signOutAction: {
    fontSize: 20,
    fontWeight: 400,
    letterSpacing: "0.15em",
    textAlign: "left" as const,
    marginBottom: 40,
  },
  row: {
    width: "100%",
    textAlign: "left" as const,
    padding: "13px 0",
    fontSize: 23,
  },
};

export type AccountKey = "change-password" | "delete-account";

export function AccountPane({
  activeAccountAction,
  onSelectAccountAction,
  onBack,
}: {
  activeAccountAction: AccountKey | null;
  onSelectAccountAction: (key: AccountKey) => void;
  onBack?: () => void;
}) {
  return (
    <ScrollPane style={styles.pane}>
      {onBack ? (
        <div style={styles.headerMobile}>
          <BackButton onBack={onBack} style={styles.backButtonMobile} />
          Account
        </div>
      ) : (
        <div style={styles.headerTitle}>Account</div>
      )}

      {auth.currentUser?.email && <div style={styles.email}>Signed in as {auth.currentUser.email}</div>}

      <button type="button" style={styles.signOutAction} onClick={() => signOut(auth)}>
        SIGN OUT
      </button>

      <button
        type="button"
        style={{ ...styles.row, textDecoration: activeAccountAction === "change-password" ? "underline" : "none" }}
        onClick={() => onSelectAccountAction("change-password")}
      >
        Change Password
      </button>

      <button
        type="button"
        style={{ ...styles.row, textDecoration: activeAccountAction === "delete-account" ? "underline" : "none" }}
        onClick={() => onSelectAccountAction("delete-account")}
      >
        Delete Account
      </button>
    </ScrollPane>
  );
}
