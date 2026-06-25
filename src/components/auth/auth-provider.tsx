"use client";

import * as React from "react";

import type { FrontendSession, SessionUser } from "@/lib/auth/session";

type SignupPayload = {
  name: string;
  email: string;
  password: string;
  organization: string;
  account_type: "MANAGER";
  confirm_new_organization?: boolean;
};

type CompleteProfilePayload = {
  full_name: string;
  job_title: string;
  profession_disciplines: string[];
  organization: string;
  phone_number?: string;
};

type SessionResponse = { user: SessionUser };

type AuthContextValue = {
  session: FrontendSession | null;
  login: (payload: { email: string; password: string }) => Promise<FrontendSession>;
  signup: (payload: SignupPayload) => Promise<void>;
  refreshSession: () => Promise<FrontendSession | null>;
  completeProfile: (payload: CompleteProfilePayload) => Promise<FrontendSession>;
  /** Stores an externally-acquired session (e.g. after invite acceptance). */
  adoptSession: (session: FrontendSession) => void;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  const data: unknown = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const record = data as Record<string, unknown>;
    const detail =
      typeof record.detail === "string"
        ? record.detail
        : typeof record.error === "string"
          ? record.error
          : "Request failed.";
    throw new Error(detail);
  }
  return data as T;
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store" });
  const text = await response.text();
  const data: unknown = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error("Unauthorized");
  }
  return data as T;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<FrontendSession | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Hydrate session from the HttpOnly cookie via the session route handler.
  React.useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      try {
        const data = await apiGet<SessionResponse>("/api/auth/session");
        if (!cancelled) setSession({ user: data.user });
      } catch {
        // 401 means no valid session — not an error state, just unauthenticated.
        if (!cancelled) setSession(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      loading,

      login: async (payload) => {
        const data = await apiPost<SessionResponse>("/api/auth/login", payload);
        const nextSession: FrontendSession = { user: data.user };
        setSession(nextSession);
        return nextSession;
      },

      signup: async (payload) => {
        await apiPost("/api/auth/signup", payload);
      },

      refreshSession: async () => {
        try {
          const data = await apiGet<SessionResponse>("/api/auth/session");
          const nextSession: FrontendSession = { user: data.user };
          setSession(nextSession);
          return nextSession;
        } catch {
          setSession(null);
          return null;
        }
      },

      completeProfile: async (payload) => {
        const data = await apiPost<SessionResponse>("/api/auth/complete-profile", payload);
        const nextSession: FrontendSession = { user: data.user };
        setSession(nextSession);
        return nextSession;
      },

      adoptSession: (nextSession) => {
        setSession(nextSession);
      },

      logout: async () => {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
        setSession(null);
      },
    }),
    [loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
