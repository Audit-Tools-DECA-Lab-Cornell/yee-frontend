import { NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth/cookies";
import type { SessionUser } from "@/lib/auth/session-types";
import { getApiBaseUrl } from "@/app/api/_lib/backend-config";
import { errorResponse } from "@/app/api/_lib/api-response";

type BackendAcceptResponse = {
	access_token: string;
	token_type: "bearer";
	user: SessionUser;
};

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
	const { token } = await params;
	const body: unknown = await request.json();

	const backendUrl = `${getApiBaseUrl()}/yee/auth/manager-invites/${encodeURIComponent(token)}/accept`;

	try {
		const response = await fetch(backendUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
			cache: "no-store"
		});

		const text = await response.text();
		const data: unknown = text ? JSON.parse(text) : {};

		if (!response.ok) {
			return NextResponse.json(data, { status: response.status });
		}

		const acceptData = data as BackendAcceptResponse;
		const nextResponse = NextResponse.json({ user: acceptData.user });
		setSessionCookie(nextResponse, acceptData.access_token);
		return nextResponse;
	} catch (error) {
		return errorResponse(
			`Manager invite acceptance failed: ${error instanceof Error ? error.message : String(error)}`,
			502
		);
	}
}
