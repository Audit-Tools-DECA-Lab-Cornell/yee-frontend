import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSessionToken } from "@/lib/auth/cookies";
import type { SessionUser } from "@/types/auth";
import { getApiBaseUrl } from "@/server/backend/config";
import { errorResponse } from "@/server/backend/response";

type BackendMeResponse = {
	user: SessionUser;
};

/**
 * GET /api/auth/session
 *
 * Validates the HttpOnly session cookie by proxying to the backend /me endpoint.
 * Returns { user } on success, or 401 if the session is missing or invalid.
 * Used by the auth provider on mount to hydrate client session state.
 */
export async function GET(request: NextRequest) {
	const token = getSessionToken(request);
	if (!token) {
		return errorResponse("Unauthorized", 401);
	}

	const backendUrl = `${getApiBaseUrl()}/yee/auth/me`;

	try {
		const response = await fetch(backendUrl, {
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json"
			},
			cache: "no-store"
		});

		if (!response.ok) {
			return errorResponse("Unauthorized", 401);
		}

		const data = (await response.json()) as BackendMeResponse;
		return NextResponse.json({ user: data.user });
	} catch {
		return errorResponse("Session validation failed", 502);
	}
}
