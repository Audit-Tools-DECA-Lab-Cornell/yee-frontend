import { NextResponse } from "next/server";

function getApiBaseUrl(): string {
	return process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
}

type RouteContext = {
	params: Promise<{ auditId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
	const { auditId } = await context.params;
	const targetUrl = `${getApiBaseUrl()}/yee/dashboard/audits/${encodeURIComponent(auditId)}/edit`;

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

export async function PATCH(request: Request, context: RouteContext) {
	const { auditId } = await context.params;
	const payload = await request.json();
	const targetUrl = `${getApiBaseUrl()}/yee/dashboard/audits/${encodeURIComponent(auditId)}/edit`;

	try {
		const response = await fetch(targetUrl, {
			method: "PATCH",
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
