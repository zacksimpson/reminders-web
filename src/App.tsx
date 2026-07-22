import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
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

  return <div style={{ padding: 22 }}>Signed in as {user.email}</div>;
}

export default App;
