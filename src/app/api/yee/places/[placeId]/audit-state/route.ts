import { NextResponse } from "next/server";

function getApiBaseUrl(): string {
	return process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
}

type RouteContext = {
	params: Promise<{ placeId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
	const { placeId } = await context.params;
	const targetUrl = `${getApiBaseUrl()}/yee/places/${encodeURIComponent(placeId)}/audit-state`;

	try {
		const response = await fetch(targetUrl, {
			headers: request.headers.get("authorization")
				? { Authorization: request.headers.get("authorization") as string }
				: undefined,
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

export async function PUT(request: Request, context: RouteContext) {
	const { placeId } = await context.params;
	const payload = await request.json();
	const targetUrl = `${getApiBaseUrl()}/yee/places/${encodeURIComponent(placeId)}/draft`;

	try {
		const response = await fetch(targetUrl, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				...(request.headers.get("authorization") ? { Authorization: request.headers.get("authorization") as string } : {})
			},
			body: JSON.stringify(payload)
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
