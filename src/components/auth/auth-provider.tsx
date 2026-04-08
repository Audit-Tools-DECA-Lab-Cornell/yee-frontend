"use client";

import * as React from "react";

import { completeProfile, getCurrentUser, login as loginRequest, signup as signupRequest } from "@/lib/auth/api";
import type { FrontendSession } from "@/lib/auth/session";
import { clearSession, loadSession, saveSession } from "@/lib/auth/session";

type AuthContextValue = {
	session: FrontendSession | null;
	login: (payload: { email: string; password: string }) => Promise<FrontendSession>;
	signup: (payload: { name: string; email: string; password: string; account_type: "MANAGER" | "AUDITOR" }) => Promise<void>;
	refreshSession: () => Promise<FrontendSession | null>;
	completeProfile: (name: string) => Promise<FrontendSession>;
	adoptSession: (session: FrontendSession) => void;
	logout: () => void;
	loading: boolean;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [session, setSession] = React.useState<FrontendSession | null>(null);
	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		let cancelled = false;

		const restore = async () => {
			const stored = loadSession();
			if (!stored) {
				if (!cancelled) {
					setSession(null);
					setLoading(false);
				}
				return;
			}

			try {
				const user = await getCurrentUser(stored.accessToken);
				const nextSession = { accessToken: stored.accessToken, user };
				saveSession(nextSession);
				if (!cancelled) {
					setSession(nextSession);
				}
			} catch {
				clearSession();
				if (!cancelled) {
					setSession(null);
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
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
			login: async payload => {
				const nextSession = await loginRequest(payload);
				saveSession(nextSession);
				setSession(nextSession);
				return nextSession;
			},
			signup: async payload => {
				await signupRequest(payload);
			},
			refreshSession: async () => {
				const stored = loadSession();
				if (!stored) {
					setSession(null);
					return null;
				}
				try {
					const user = await getCurrentUser(stored.accessToken);
					const nextSession = { accessToken: stored.accessToken, user };
					saveSession(nextSession);
					setSession(nextSession);
					return nextSession;
				} catch {
					clearSession();
					setSession(null);
					return null;
				}
			},
			completeProfile: async name => {
				const stored = loadSession();
				if (!stored) {
					throw new Error("You need to log in again.");
				}
				const user = await completeProfile(stored.accessToken, name);
				const nextSession = { accessToken: stored.accessToken, user };
				saveSession(nextSession);
				setSession(nextSession);
				return nextSession;
			},
			adoptSession: nextSession => {
				saveSession(nextSession);
				setSession(nextSession);
			},
			logout: () => {
				clearSession();
				setSession(null);
			}
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
