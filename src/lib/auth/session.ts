"use client";

export type UserRole = "ADMIN" | "MANAGER" | "AUDITOR";
export type AuthNextStep = "VERIFY_EMAIL" | "WAITING_APPROVAL" | "COMPLETE_PROFILE" | "DASHBOARD";

export type SessionUser = {
	id: string;
	email: string;
	name: string | null;
	account_id: string | null;
	organization: string | null;
	account_type: UserRole;
	email_verified: boolean;
	approved: boolean;
	profile_completed: boolean;
	next_step: AuthNextStep;
	dashboard_path: string;
};

export type FrontendSession = {
	accessToken: string;
	user: SessionUser;
};

const SESSION_STORAGE_KEY = "audit-tools-frontend-session";

export function saveSession(session: FrontendSession) {
	window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function loadSession(): FrontendSession | null {
	const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as FrontendSession;
	} catch {
		window.localStorage.removeItem(SESSION_STORAGE_KEY);
		return null;
	}
}

export function clearSession() {
	window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getRouteForUser(user: SessionUser): string {
	switch (user.next_step) {
		case "VERIFY_EMAIL":
			return `/verify-email?email=${encodeURIComponent(user.email)}`;
		case "WAITING_APPROVAL":
			return "/waiting-approval";
		case "COMPLETE_PROFILE":
			return "/complete-profile";
		case "DASHBOARD":
		default:
			return user.dashboard_path;
	}
}
