import { createContext, useContext, useEffect, useState } from "react";
import { Profile, fetchMe, loadStoredToken, setAuthToken } from "./api";

interface AuthState {
  user: Profile | null;
  setUser: (user: Profile | null) => void;
  /** true mens lagret innlogging gjenopprettes ved appstart */
  restoring: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  setUser: () => {},
  restoring: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [restoring, setRestoring] = useState(true);

  // Gjenopprett innloggingen fra sikker lagring ved appstart
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await loadStoredToken();
        if (token) {
          const me = await fetchMe();
          if (cancelled) return;
          if (me) {
            setUser(me);
          } else {
            // Utløpt eller ugyldig sesjon – rydd opp
            setAuthToken(null);
          }
        }
      } catch {
        // Nettverksfeil: behold tokenet og prøv igjen neste gang.
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, restoring }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
