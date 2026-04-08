import { NextResponse } from "next/server";

export function getApiBaseUrl(): string {
	return process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
}

export async function proxyJsonRequest({
	targetPath,
	method = "GET",
	body,
	authorization
}: {
	targetPath: string;
	method?: "GET" | "POST";
	body?: unknown;
	authorization?: string | null;
}) {
	const targetUrl = `${getApiBaseUrl()}${targetPath}`;

	try {
		const response = await fetch(targetUrl, {
			method,
			headers: {
				"Content-Type": "application/json",
				...(authorization ? { Authorization: authorization } : {})
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
