import { NextResponse } from "next/server";

function getApiBaseUrl(): string {
	return process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
}

export async function proxyDashboardRequest({
	targetPath,
	authorization,
	method = "GET",
	body,
	headers
}: {
	targetPath: string;
	authorization?: string | null;
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: unknown;
	headers?: HeadersInit;
}) {
	const targetUrl = `${getApiBaseUrl()}${targetPath}`;

	try {
		const response = await fetch(targetUrl, {
			method,
			headers: {
				"Content-Type": "application/json",
				...(authorization ? { Authorization: authorization } : {}),
				...(headers || {})
			},
			...(body === undefined ? {} : { body: JSON.stringify(body) }),
			cache: "no-store"
		});

		const text = await response.text();
		const data = text ? (JSON.parse(text) as unknown) : {};
		return NextResponse.json(data, { status: response.status });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Could not reach backend",
				details: error instanceof Error ? error.message : String(error),
				targetUrl
			},
			{ status: 502 }
		);
	}
}
