import { BackButton } from "./BackButton";
import { ScrollPane } from "./ScrollPane";

// Placeholder for account management (delete account, change password, link
// account), not built yet. Just holds the nav slot and layout for now.
const styles = {
  pane: { padding: "30px 24px" },
  headerTitle: { fontSize: 32, fontWeight: 400 },
  headerMobile: {
    textAlign: "center" as const,
    fontSize: 23,
    marginBottom: 26,
    position: "relative" as const,
  },
  backButtonMobile: { position: "absolute" as const, left: 0, top: 3 },
};

export function AccountPane({ onBack }: { onBack?: () => void }) {
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
    </ScrollPane>
  );
}
