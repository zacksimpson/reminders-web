import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { AppShell } from "./AppShell";
import { AuthScreen } from "./AuthScreen";
import { ConnectBackendPreview } from "./ConnectBackendPreview";
import { auth } from "./firebase";
import { VerifyEmailScreen } from "./VerifyEmailScreen";

// Accounts created before email verification existed were never asked to
// verify, so enforcing it retroactively would lock them out. Only accounts
// created from this point on are required to verify.
const EMAIL_VERIFICATION_REQUIRED_SINCE = new Date("2026-07-24T00:00:00Z").getTime();

function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  // Bumped after VerifyEmailScreen confirms verification, purely to force a
  // re-render — user.reload() mutates the existing User object in place
  // rather than firing onAuthStateChanged again.
  const [, setRefreshTick] = useState(0);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  if (window.location.pathname === "/connect-preview") {
    return <ConnectBackendPreview />;
  }

  if (user === undefined) {
    return null;
  }

  if (user === null) {
    return <AuthScreen />;
  }

  const createdAt = user.metadata.creationTime ? new Date(user.metadata.creationTime).getTime() : 0;
  const needsVerification = !user.emailVerified && createdAt >= EMAIL_VERIFICATION_REQUIRED_SINCE;

  if (needsVerification) {
    return <VerifyEmailScreen onVerified={() => setRefreshTick((t) => t + 1)} />;
  }

  return <AppShell user={user} />;
}

export default App;
