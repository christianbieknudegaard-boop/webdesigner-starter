import { createContext, useContext, useState } from "react";
import { Profile } from "./api";

interface AuthState {
  user: Profile | null;
  setUser: (user: Profile | null) => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  setUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
