import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { type FormEvent, useState } from "react";
import { auth } from "./firebase";

const styles = {
  page: {
    minHeight: "100%",
    display: "flex",
    flexDirection: "column" as const,
    padding: "48px 22px",
    maxWidth: 420,
  },
  title: {
    fontSize: 32,
    margin: "0 0 40px",
    fontWeight: 400,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  field: {
    marginBottom: 28,
  },
  input: {
    width: "100%",
    fontSize: 22,
    paddingBottom: 8,
    borderBottom: "2px solid #fff",
  },
  action: {
    fontSize: 20,
    fontWeight: 500,
    letterSpacing: "0.15em",
    marginTop: 8,
    textAlign: "left" as const,
  },
  toggle: {
    fontSize: 15,
    marginTop: 32,
  },
  toggleLink: {
    textDecoration: "underline",
    textUnderlineOffset: 3,
  },
  error: {
    fontSize: 14,
    marginTop: -12,
    marginBottom: 24,
  },
};

export function AuthScreen() {
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
    <form style={styles.page} onSubmit={handleSubmit}>
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
