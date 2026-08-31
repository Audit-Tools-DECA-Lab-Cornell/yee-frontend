import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { fetchPublicCached } from "@/server/cached";
import { proxyPublicRequest } from "@/server/proxy";

/**
 * The YEE instrument definition is public — no auth required. Cached under
 * the "yee-instrument" tag; admin instrument mutations expire it.
 */
export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const instrumentKey = searchParams.get("instrument_key");
	const instrumentVersion = searchParams.get("instrument_version");
	const hasExactStamp = instrumentKey !== null && instrumentVersion !== null;
	const query = hasExactStamp
		? `?instrument_key=${encodeURIComponent(instrumentKey)}&instrument_version=${encodeURIComponent(instrumentVersion)}`
		: "";
	const backendPath = `/yee/instrument${query}`;
	const cacheTag = hasExactStamp ? `yee-instrument:${instrumentKey}:${instrumentVersion}` : "yee-instrument";
	try {
		const data = await fetchPublicCached(backendPath, cacheTag);
		return NextResponse.json(data);
	} catch {
		// Backend error — fall back to the uncached proxy so the client gets
		// the real status code instead of a cached failure.
		return proxyPublicRequest({ path: backendPath });
	}
}
