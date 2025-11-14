import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

type AuthContextValue = {
  isAuthenticated: boolean;
  token?: string;
  login: (token?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | undefined>("demo-token");
  const isAuthenticated = Boolean(token);

  const login = useCallback((nextToken?: string) => {
    setToken(nextToken ?? "demo-token");
  }, []);

  const logout = useCallback(() => {
    setToken(undefined);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      token,
      login,
      logout,
    }),
    [isAuthenticated, token, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
