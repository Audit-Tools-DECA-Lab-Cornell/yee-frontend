import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/auth/cookies";

/** Clears the HttpOnly session cookie, ending the server-managed session. */
export async function POST() {
	const response = new NextResponse(null, { status: 204 });
	clearSessionCookie(response);
	return response;
}
