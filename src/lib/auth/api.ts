"use client";

import type { FrontendSession, SessionUser } from "@/lib/auth/session";

type LoginPayload = {
	email: string;
	password: string;
};

type SignupPayload = {
	name: string;
	email: string;
	password: string;
	organization: string;
	account_type: "MANAGER";
	confirm_new_organization?: boolean;
};

type SignupResponse = {
	message: string;
	email_verification_required: boolean;
	next_step: string;
};

type SessionResponse = {
	user: SessionUser;
};

type InvitePreview = {
	email: string;
	organization: string | null;
	expires_at: string;
	accepted: boolean;
};

type ManagerInvitePreview = {
	email: string;
	organization: string | null;
	invited_by_name: string | null;
	expires_at: string;
	accepted: boolean;
};

type CompleteProfilePayload = {
	full_name: string;
	job_title: string;
	profession_disciplines: string[];
	organization: string;
	phone_number?: string;
};

/** Shared fetch helper that parses JSON and throws on non-2xx responses. */
async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
	const response = await fetch(input, {
		...init,
		headers: {
			"Content-Type": "application/json",
			...(init?.headers ?? {})
		}
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

/**
 * Logs in the user.
 * The route handler sets an HttpOnly cookie; the browser never sees the raw token.
 * Returns a FrontendSession with only the user object.
 */
export async function login(payload: LoginPayload): Promise<FrontendSession> {
	const data = await apiRequest<SessionResponse>("/api/auth/login", {
		method: "POST",
		body: JSON.stringify(payload)
	});
	return { user: data.user };
}

export async function signup(payload: SignupPayload): Promise<SignupResponse> {
	return apiRequest<SignupResponse>("/api/auth/signup", {
		method: "POST",
		body: JSON.stringify(payload)
	});
}

/** Fetches the current user via the session route. Cookie is sent automatically. */
export async function getCurrentUser(): Promise<SessionUser> {
	const data = await apiRequest<SessionResponse>("/api/auth/session", {
		cache: "no-store"
	});
	return data.user;
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
	return apiRequest<{ message: string }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
		cache: "no-store"
	});
}

export async function resendVerification(email: string): Promise<{ message: string }> {
	return apiRequest<{ message: string }>("/api/auth/resend-verification", {
		method: "POST",
		body: JSON.stringify({ email, website: "" })
	});
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
	return apiRequest<{ message: string }>("/api/auth/forgot-password", {
		method: "POST",
		body: JSON.stringify({ email, website: "" })
	});
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
	return apiRequest<{ message: string }>("/api/auth/reset-password", {
		method: "POST",
		body: JSON.stringify({ token, password, website: "" })
	});
}

/**
 * Completes the user profile after first login.
 * The session cookie is sent automatically — no accessToken argument needed.
 */
export async function completeProfile(payload: CompleteProfilePayload): Promise<SessionUser> {
	// The backend's complete-profile contract expects `name` (see CompleteProfileRequest);
	// map our `full_name` field across so the request body matches.
	const { full_name, ...rest } = payload;
	const data = await apiRequest<SessionResponse>("/api/auth/complete-profile", {
		method: "POST",
		body: JSON.stringify({ name: full_name, ...rest })
	});
	return data.user;
}

export async function getInvitePreview(token: string): Promise<InvitePreview> {
	return apiRequest<InvitePreview>(`/api/auth/invite/${encodeURIComponent(token)}`, { cache: "no-store" });
}

export async function getManagerInvitePreview(token: string): Promise<ManagerInvitePreview> {
	return apiRequest<ManagerInvitePreview>(`/api/auth/manager-invites/${encodeURIComponent(token)}`, {
		cache: "no-store"
	});
}

/**
 * Accepts an auditor invite.
 * The route handler sets the session cookie and returns { user }.
 */
export async function acceptInvite(
	token: string,
	payload: { name: string; password: string }
): Promise<FrontendSession> {
	const data = await apiRequest<SessionResponse>(`/api/auth/invite/${encodeURIComponent(token)}/accept`, {
		method: "POST",
		body: JSON.stringify(payload)
	});
	return { user: data.user };
}

/**
 * Accepts a manager invite.
 * The route handler sets the session cookie and returns { user }.
 */
export async function acceptManagerInvite(
	token: string,
	payload: { name: string; password: string; position?: string }
): Promise<FrontendSession> {
	const data = await apiRequest<SessionResponse>(`/api/auth/manager-invites/${encodeURIComponent(token)}/accept`, {
		method: "POST",
		body: JSON.stringify(payload)
	});
	return { user: data.user };
}
