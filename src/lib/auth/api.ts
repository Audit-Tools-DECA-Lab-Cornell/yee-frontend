"use client";

import type { FrontendSession, SessionUser, UserRole } from "@/lib/auth/session";

type LoginPayload = {
	email: string;
	password: string;
};

type SignupPayload = {
	name: string;
	email: string;
	password: string;
	account_type: Exclude<UserRole, "ADMIN">;
};

type LoginResponse = {
	access_token: string;
	token_type: "bearer";
	expires_at: string;
	user: SessionUser;
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

async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
	const response = await fetch(input, {
		...init,
		headers: {
			"Content-Type": "application/json",
			...(init?.headers || {})
		}
	});

	const text = await response.text();
	const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};

	if (!response.ok) {
		const detail =
			typeof data.detail === "string"
				? data.detail
				: typeof data.error === "string"
					? data.error
					: "Request failed.";
		throw new Error(detail);
	}

	return data as T;
}

export async function login(payload: LoginPayload): Promise<FrontendSession> {
	const data = await apiRequest<LoginResponse>("/api/auth/login", {
		method: "POST",
		body: JSON.stringify(payload)
	});

	return {
		accessToken: data.access_token,
		user: data.user
	};
}

export async function signup(payload: SignupPayload): Promise<SignupResponse> {
	return apiRequest<SignupResponse>("/api/auth/signup", {
		method: "POST",
		body: JSON.stringify(payload)
	});
}

export async function getCurrentUser(accessToken: string): Promise<SessionUser> {
	const data = await apiRequest<SessionResponse>("/api/auth/me", {
		headers: {
			Authorization: `Bearer ${accessToken}`
		},
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

export async function completeProfile(accessToken: string, name: string): Promise<SessionUser> {
	const data = await apiRequest<SessionResponse>("/api/auth/complete-profile", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`
		},
		body: JSON.stringify({ name })
	});

	return data.user;
}

export async function getInvitePreview(token: string): Promise<InvitePreview> {
	return apiRequest<InvitePreview>(`/api/auth/invite/${encodeURIComponent(token)}`, {
		cache: "no-store"
	});
}

export async function acceptInvite(
	token: string,
	payload: { name: string; password: string }
): Promise<FrontendSession> {
	const data = await apiRequest<LoginResponse>(`/api/auth/invite/${encodeURIComponent(token)}/accept`, {
		method: "POST",
		body: JSON.stringify(payload)
	});

	return {
		accessToken: data.access_token,
		user: data.user
	};
}
