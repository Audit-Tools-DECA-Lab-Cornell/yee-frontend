import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

import { proxyRequest } from "@/server/backend/proxy";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const instrumentKey = searchParams.get("instrument_key") ?? "yee";
	return proxyRequest({
		request,
		path: `/yee/admin/instruments?instrument_key=${encodeURIComponent(instrumentKey)}`
	});
}

export async function POST(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const activate = searchParams.get("activate") ?? "true";
	const response = await proxyRequest({
		request,
		path: `/yee/admin/instruments?activate=${encodeURIComponent(activate)}`,
		method: "POST",
		body: await request.json()
	});
	if (response.ok) {
		// Expire the cached public instrument so a newly activated version ships immediately.
		revalidateTag("yee-instrument", { expire: 0 });
	}
	return response;
}
