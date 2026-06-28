import { type APIRequestContext, expect } from "@playwright/test";

import { type E2ERole, e2eUsers } from "../fixtures/users";

interface AuthResponsePayload {
	access_token: string;
	token_type: string;
	expires_at: string;
	user: {
		id: string;
		email: string;
		name: string | null;
		account_id: string | null;
		account_type: "ADMIN" | "MANAGER" | "AUDITOR";
		next_step: string;
		dashboard_path: string;
	};
}

export function getApiBaseUrl(): string {
	return process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
}

export async function loginViaApi(request: APIRequestContext, role: E2ERole): Promise<string> {
	const credentials = e2eUsers[role];
	const response = await request.post(`${getApiBaseUrl()}/yee/auth/login`, {
		data: {
			email: credentials.email,
			password: credentials.password
		}
	});
	expect(response.ok(), await response.text()).toBeTruthy();
	const payload = (await response.json()) as AuthResponsePayload;
	expect(payload.access_token).toBeTruthy();
	return payload.access_token;
}

export function bearerHeaders(token: string): Record<string, string> {
	return { Authorization: `Bearer ${token}` };
}

export async function expectOk(response: { ok(): boolean; text(): Promise<string> }): Promise<void> {
	expect(response.ok(), await response.text()).toBeTruthy();
}
