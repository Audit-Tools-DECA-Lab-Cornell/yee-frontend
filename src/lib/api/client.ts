"use client";

/**
 * Structured error thrown by API fetch helpers.
 *
 * `payload` keeps the parsed response body so callers can render structured
 * detail the flat `message` cannot carry — FastAPI returns object-shaped
 * `detail` for several failures (for example the instrument publish 409, whose
 * `detail.scoring_compatibility` names the questions the scoring engine needs).
 * Without it that detail is discarded here and is unrecoverable further up.
 */
export class ApiError extends Error {
	constructor(
		public readonly status: number,
		message: string,
		public readonly payload: unknown = null
	) {
		super(message);
		this.name = "ApiError";
	}
}

/**
 * Best-effort human message from an error body, tolerating both FastAPI shapes:
 * `{detail: "…"}` and `{detail: {message: "…", …}}`.
 */
export function readErrorMessage(data: unknown, status: number): string {
	const record = (data ?? {}) as Record<string, unknown>;
	if (typeof record.detail === "string") return record.detail;
	if (record.detail && typeof record.detail === "object") {
		const detail = record.detail as Record<string, unknown>;
		if (typeof detail.message === "string") return detail.message;
	}
	if (typeof record.error === "string") return record.error;
	return `Request failed with status ${status}.`;
}

async function parseResponse<T>(response: Response): Promise<T> {
	const text = await response.text();
	const data: unknown = text ? JSON.parse(text) : {};
	if (!response.ok) {
		throw new ApiError(response.status, readErrorMessage(data, response.status), data);
	}
	return data as T;
}

/** GET request to a Next.js route handler. Cookie is sent automatically. */
export async function apiGet<T>(path: string): Promise<T> {
	const response = await fetch(path, { cache: "no-store" });
	return parseResponse<T>(response);
}

/** POST request to a Next.js route handler. */
export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
	const response = await fetch(path, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		...(body !== undefined ? { body: JSON.stringify(body) } : {})
	});
	return parseResponse<T>(response);
}

/** PATCH request to a Next.js route handler. */
export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
	const response = await fetch(path, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		...(body !== undefined ? { body: JSON.stringify(body) } : {})
	});
	return parseResponse<T>(response);
}

/** DELETE request to a Next.js route handler. */
export async function apiDelete<T>(path: string, body?: unknown): Promise<T> {
	const response = await fetch(path, {
		method: "DELETE",
		headers: { "Content-Type": "application/json" },
		...(body !== undefined ? { body: JSON.stringify(body) } : {})
	});
	return parseResponse<T>(response);
}
