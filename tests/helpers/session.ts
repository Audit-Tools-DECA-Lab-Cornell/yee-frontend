import { type APIRequestContext, type BrowserContext } from "@playwright/test";

import { SESSION_COOKIE_NAME } from "../../src/lib/auth/cookies";
import { type E2ERole } from "../fixtures/users";
import { loginViaApi } from "./api";

const DEFAULT_BASE_URL = "http://localhost:3000";

export function getE2EBaseUrl(): URL {
	return new URL(process.env.E2E_BASE_URL ?? DEFAULT_BASE_URL);
}

export async function seedBrowserSession(
	context: BrowserContext,
	request: APIRequestContext,
	role: E2ERole
): Promise<void> {
	const token = await loginViaApi(request, role);
	const baseUrl = getE2EBaseUrl();

	await context.clearCookies();
	await context.addCookies([
		{
			name: SESSION_COOKIE_NAME,
			value: token,
			url: baseUrl.origin,
			httpOnly: true,
			secure: baseUrl.protocol === "https:",
			sameSite: "Lax"
		}
	]);
}
