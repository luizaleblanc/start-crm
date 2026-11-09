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

interface AuthResponse {
  accessToken: string;
  user: User;
}

interface RegisterInput {
  name: string;
  organizationName: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const emptySubscribe = () => () => {};

function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

function getUserSnapshot(): User | null {
  const session = getStoredSession();
  return (session?.user as User | undefined) ?? null;
}

function getServerUserSnapshot(): User | null {
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const isHydrated = useHydrated();
  const user = useSyncExternalStore(subscribeToSession, getUserSnapshot, getServerUserSnapshot);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    setStoredSession({ accessToken: response.accessToken, user: response.user });
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const response = await apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: input,
      auth: false,
    });
    setStoredSession({ accessToken: response.accessToken, user: response.user });
  }, []);

  const logout = useCallback(() => {
    setStoredSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: !isHydrated,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return context;
}
