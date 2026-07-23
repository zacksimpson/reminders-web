import {
  createUserWithEmailAndPassword,
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
  toggle: {
    fontSize: 16,
    lineHeight: 1.6,
    marginTop: 30,
  },
  toggleLink: {
    textDecoration: "underline",
    textUnderlineOffset: 3,
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
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      if (mode === "signIn") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form style={{ ...styles.page, padding: outerPadding }} onSubmit={handleSubmit}>
      <div style={styles.title}>{mode === "signIn" ? "Sign in" : "Create account"}</div>

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

      {error && <div style={styles.error}>{error}</div>}

      <button style={styles.action} type="submit" disabled={busy}>
        {mode === "signIn" ? "SIGN IN" : "CREATE ACCOUNT"}
      </button>

      <div style={styles.toggle}>
        {mode === "signIn" ? (
          <>
            Don't have an account?{" "}
            <button
              type="button"
              style={{ ...styles.toggleLink, fontSize: "inherit" }}
              onClick={() => setMode("signUp")}
            >
              Create one
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              style={{ ...styles.toggleLink, fontSize: "inherit" }}
              onClick={() => setMode("signIn")}
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </form>
  );
}
