import { NextResponse } from "next/server";

export type ApiError = { error: string; status: number };

/** Returns a JSON error response without leaking internal details. */
export function errorResponse(message: string, status: number): NextResponse {
	return NextResponse.json({ error: message }, { status });
}

/**
 * Safely parse a backend response body as JSON.
 *
 * The backend normally replies with JSON, but an unhandled 500 returns a
 * plain-text "Internal Server Error" body. Calling `JSON.parse` on that throws
 * `Unexpected token 'I', "Internal S"... is not valid JSON`, which previously
 * leaked to users as the surface error. Instead of throwing, wrap any
 * non-JSON body as `{ detail: <text> }` so callers always get a usable shape
 * and the client can render the backend's message (or a clean fallback).
 */
export function parseBackendJson(text: string): unknown {
	if (!text) {
		return {};
	}
	try {
		return JSON.parse(text);
	} catch {
		return { detail: text.trim() || "The server returned an unexpected response." };
	}
}
