import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSessionToken } from "@/lib/auth/cookies";
import { getApiBaseUrl } from "./config";
import { errorResponse, parseBackendJson } from "./response";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ProxyRequestOptions = {
	/** Incoming Next.js request — used to read the session cookie. */
	request: NextRequest | Request;
	/** Backend path, e.g. "/yee/dashboard/overview". */
	path: string;
	method?: HttpMethod;
	/** JSON-serialisable request body. */
	body?: unknown;
	/** Extra headers to forward to the backend. */
	additionalHeaders?: Record<string, string>;
};

/**
 * Authenticated backend proxy.
 *
 * Reads the session token from the HttpOnly cookie on the incoming request,
 * constructs the full backend URL, and forwards the call with Authorization.
 * The raw token is NEVER exposed to the browser — this runs server-side only.
 */
export async function proxyRequest({
	request,
	path,
	method = "GET",
	body,
	additionalHeaders
}: ProxyRequestOptions): Promise<NextResponse> {
	const token = getSessionToken(request);
	if (!token) {
		return errorResponse("Unauthorized", 401);
	}

	const backendUrl = `${getApiBaseUrl()}${path}`;

	try {
		const response = await fetch(backendUrl, {
			method,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
				...(additionalHeaders ?? {})
			},
			...(body === undefined ? {} : { body: JSON.stringify(body) }),
			cache: "no-store"
		});

		const text = await response.text();
		// Parse JSON when possible; a non-JSON body (e.g. an unhandled 500) is
		// wrapped as { detail: <text> } so callers never hit a parse error.
		const data: unknown = parseBackendJson(text);
		return NextResponse.json(data, { status: response.status });
	} catch (error) {
		// Do NOT expose backendUrl in the error — it could reveal internal topology.
		return errorResponse(`Backend request failed: ${error instanceof Error ? error.message : String(error)}`, 502);
	}
}

/**
 * Unauthenticated backend proxy (for public endpoints like login, signup,
 * password reset, and email verification that don't require a session cookie).
 */
type PublicProxyOptions = {
	path: string;
	method?: HttpMethod;
	body?: unknown;
	additionalHeaders?: Record<string, string>;
};

export async function proxyPublicRequest({
	path,
	method = "GET",
	body,
	additionalHeaders
}: PublicProxyOptions): Promise<NextResponse> {
	const backendUrl = `${getApiBaseUrl()}${path}`;

	try {
		const response = await fetch(backendUrl, {
			method,
			headers: {
				"Content-Type": "application/json",
				...(additionalHeaders ?? {})
			},
			...(body === undefined ? {} : { body: JSON.stringify(body) }),
			cache: "no-store"
		});

		const text = await response.text();
		const data: unknown = parseBackendJson(text);
		return NextResponse.json(data, { status: response.status });
	} catch (error) {
		return errorResponse(`Backend request failed: ${error instanceof Error ? error.message : String(error)}`, 502);
	}
}
