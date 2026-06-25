"use client";

/** Structured error thrown by API fetch helpers. */
export class ApiError extends Error {
	constructor(
		public readonly status: number,
		message: string
	) {
		super(message);
		this.name = "ApiError";
	}
}

async function parseResponse<T>(response: Response): Promise<T> {
	const text = await response.text();
	const data: unknown = text ? JSON.parse(text) : {};
	if (!response.ok) {
		const record = data as Record<string, unknown>;
		const message =
			typeof record.detail === "string"
				? record.detail
				: typeof record.error === "string"
					? record.error
					: `Request failed with status ${response.status}.`;
		throw new ApiError(response.status, message);
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
