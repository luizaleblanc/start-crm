"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { User } from "@/modules/iam/domain/entities";
import {
  apiFetch,
  getStoredSession,
  setStoredSession,
  subscribeToSession,
} from "@/shared/infrastructure/http/api-client";

interface LoginResponse {
  accessToken: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getSnapshot(): User | null {
  const session = getStoredSession();
  return (session?.user as User | undefined) ?? null;
}

function getServerSnapshot(): User | null {
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(subscribeToSession, getSnapshot, getServerSnapshot);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    setStoredSession({ accessToken: response.accessToken, user: response.user });
  }, []);

  const logout = useCallback(() => {
    setStoredSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading: false, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return context;
}
