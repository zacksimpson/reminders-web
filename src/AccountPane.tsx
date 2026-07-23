import { BackButton } from "./BackButton";
import { ScrollPane } from "./ScrollPane";

// Placeholder for account management (delete account, change password, link
// account), not built yet. Just holds the nav slot and layout for now.
const styles = {
  pane: { padding: "30px 24px" },
  backRow: { marginBottom: 20 },
  headerTitle: { fontSize: 32, fontWeight: 400 },
};

export function AccountPane({ onBack }: { onBack?: () => void }) {
  return (
    <ScrollPane style={styles.pane}>
      {onBack && (
        <div style={styles.backRow}>
          <BackButton onBack={onBack} />
        </div>
      )}
      <div style={styles.headerTitle}>Account</div>
    </ScrollPane>
  );
}
