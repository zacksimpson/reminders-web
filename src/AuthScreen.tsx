import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { type FormEvent, useState } from "react";
import { auth } from "./firebase";
import { useLayoutTier } from "./useLayoutTier";

const styles = {
  page: {
    minHeight: "100%",
    display: "flex",
    flexDirection: "column" as const,
    maxWidth: 420,
  },
  title: {
    fontSize: 32,
    margin: "0 0 26px",
    fontWeight: 400,
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
  linkRow: {
    fontSize: 16,
    lineHeight: 1.6,
    marginTop: 16,
  },
  link: {
    textDecoration: "underline",
    textUnderlineOffset: 3,
  },
  toggle: {
    fontSize: 16,
    lineHeight: 1.6,
    marginTop: 30,
  },
  status: {
    fontSize: 16,
    lineHeight: 1.6,
    marginTop: -10,
    marginBottom: 26,
  },
  error: {
    fontSize: 16,
    lineHeight: 1.6,
    marginTop: -10,
    marginBottom: 26,
  },
};

export function AuthScreen() {
  const tier = useLayoutTier();
  const outerPadding = tier === "mobile" ? "30px 24px" : "56px 60px";
  const centered = tier !== "mobile";
  const [mode, setMode] = useState<"signIn" | "signUp" | "forgotPassword">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function switchMode(next: "signIn" | "signUp" | "forgotPassword") {
    setMode(next);
    setError(null);
    setStatus(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setStatus(null);
    setBusy(true);
    try {
      if (mode === "signIn") {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === "signUp") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        try {
          await sendEmailVerification(cred.user);
        } catch {
          // Ignored — the post-signup verify screen has its own resend action.
        }
      } else {
        await sendPasswordResetEmail(auth, email);
        setStatus("Password reset email sent.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "signIn" ? "Sign in" : mode === "signUp" ? "Create account" : "Reset password";
  const actionLabel =
    mode === "signIn" ? "SIGN IN" : mode === "signUp" ? "CREATE ACCOUNT" : "SEND RESET EMAIL";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: centered ? "center" : "stretch",
        justifyContent: centered ? "center" : "flex-start",
      }}
    >
      <form
        style={{ ...styles.page, padding: outerPadding, width: centered ? "auto" : "100%" }}
        onSubmit={handleSubmit}
      >
        <div style={styles.title}>{title}</div>

        <div style={styles.field}>
          <div style={styles.label}>Email</div>
          <input
            style={styles.input}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {mode !== "forgotPassword" && (
          <div style={styles.field}>
            <div style={styles.label}>Password</div>
            <input
              style={styles.input}
              type="password"
              autoComplete={mode === "signIn" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        )}

        {mode === "signIn" && (
          <div style={styles.linkRow}>
            <button
              type="button"
              style={{ ...styles.link, fontSize: "inherit" }}
              onClick={() => switchMode("forgotPassword")}
            >
              Forgot password?
            </button>
          </div>
        )}

        {status && <div style={styles.status}>{status}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <button style={{ ...styles.action, marginTop: 26 }} type="submit" disabled={busy}>
          {actionLabel}
        </button>

        <div style={styles.toggle}>
          {mode === "signIn" && (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                style={{ ...styles.link, fontSize: "inherit" }}
                onClick={() => switchMode("signUp")}
              >
                Create one
              </button>
            </>
          )}
          {mode === "signUp" && (
            <>
              Already have an account?{" "}
              <button
                type="button"
                style={{ ...styles.link, fontSize: "inherit" }}
                onClick={() => switchMode("signIn")}
              >
                Sign in
              </button>
            </>
          )}
          {mode === "forgotPassword" && (
            <button
              type="button"
              style={{ ...styles.link, fontSize: "inherit" }}
              onClick={() => switchMode("signIn")}
            >
              Back to sign in
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
