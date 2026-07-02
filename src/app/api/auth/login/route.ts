import { NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth/cookies";
import type { SessionUser } from "@/types/auth";
import { getApiBaseUrl } from "@/server/backend/config";
import { errorResponse, parseBackendJson } from "@/server/backend/response";

type BackendLoginResponse = {
	access_token: string;
	token_type: "bearer";
	expires_at: string;
	user: SessionUser;
};

export async function POST(request: Request) {
	const body: unknown = await request.json();
	const backendUrl = `${getApiBaseUrl()}/yee/auth/login`;

	try {
		const response = await fetch(backendUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
			cache: "no-store"
		});

		const text = await response.text();
		const data: unknown = parseBackendJson(text);

		if (!response.ok) {
			// Forward backend error without leaking the backend URL.
			return NextResponse.json(data, { status: response.status });
		}

		const loginData = data as BackendLoginResponse;

		// Return only the user to the browser — the raw access_token goes into
		// an HttpOnly cookie and is never visible to client-side JavaScript.
		const nextResponse = NextResponse.json({ user: loginData.user });
		setSessionCookie(nextResponse, loginData.access_token);
		return nextResponse;
	} catch (error) {
		return errorResponse(`Login failed: ${error instanceof Error ? error.message : String(error)}`, 502);
	}
}
