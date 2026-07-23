import { sendEmailVerification, signOut } from "firebase/auth";
import { useState } from "react";
import { auth } from "./firebase";
import { useLayoutTier } from "./useLayoutTier";

const styles = {
  page: {
    minHeight: "100%",
    display: "flex",
    flexDirection: "column" as const,
    maxWidth: 420,
  },
  title: { fontSize: 32, margin: "0 0 26px", fontWeight: 400 },
  body: { fontSize: 16, lineHeight: 1.6, marginBottom: 30 },
  action: {
    fontSize: 20,
    fontWeight: 400,
    letterSpacing: "0.15em",
    textAlign: "left" as const,
    marginBottom: 34,
  },
  linkRow: { fontSize: 16, lineHeight: 1.6, marginBottom: 14 },
  link: { textDecoration: "underline", textUnderlineOffset: 3 },
  status: { fontSize: 16, lineHeight: 1.6, marginBottom: 26 },
};

export function VerifyEmailScreen({ onVerified }: { onVerified: () => void }) {
  const tier = useLayoutTier();
  const outerPadding = tier === "mobile" ? "30px 24px" : "56px 60px";
  const centered = tier !== "mobile";
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const email = auth.currentUser?.email ?? "";

  async function handleContinue() {
    if (busy || !auth.currentUser) return;
    setBusy(true);
    setStatus(null);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        onVerified();
      } else {
        setStatus("Still not verified — check your email, click the link, then try again.");
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    if (busy || !auth.currentUser) return;
    setBusy(true);
    setStatus(null);
    try {
      await sendEmailVerification(auth.currentUser);
      setStatus("Verification email sent.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: centered ? "center" : "stretch",
        justifyContent: centered ? "center" : "flex-start",
      }}
    >
      <div style={{ ...styles.page, padding: outerPadding, width: centered ? "auto" : "100%" }}>
        <div style={styles.title}>Verify your email</div>
        <div style={styles.body}>We sent a verification link to {email}. Click it, then continue below.</div>

        {status && <div style={styles.status}>{status}</div>}

        <button type="button" style={styles.action} disabled={busy} onClick={handleContinue}>
          {busy ? "CHECKING…" : "I'VE VERIFIED — CONTINUE"}
        </button>

        <div style={styles.linkRow}>
          <button
            type="button"
            style={{ ...styles.link, fontSize: "inherit" }}
            disabled={busy}
            onClick={handleResend}
          >
            Resend verification email
          </button>
        </div>
        <div style={styles.linkRow}>
          <button type="button" style={{ ...styles.link, fontSize: "inherit" }} onClick={() => signOut(auth)}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
