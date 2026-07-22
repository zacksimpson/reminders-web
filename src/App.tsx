import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { AppShell } from "./AppShell";
import { AuthScreen } from "./AuthScreen";
import { auth } from "./firebase";

function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  if (user === undefined) {
    return null;
  }

  if (user === null) {
    return <AuthScreen />;
  }

  return <AppShell user={user} />;
}

export default App;
