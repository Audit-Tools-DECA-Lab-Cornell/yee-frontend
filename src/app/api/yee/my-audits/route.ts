import { NextResponse } from "next/server";

function getApiBaseUrl(): string {
	return process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
}

export async function GET(request: Request) {
	const targetUrl = `${getApiBaseUrl()}/yee/my-audits`;

	try {
		const response = await fetch(targetUrl, {
			headers: {
				"Content-Type": "application/json",
				...(request.headers.get("authorization") ? { Authorization: request.headers.get("authorization") as string } : {})
			},
			cache: "no-store"
		});

		const data = await response.json();
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
