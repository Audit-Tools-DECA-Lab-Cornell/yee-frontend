import { NextResponse } from "next/server";

import { fetchPublicCached } from "@/server/backend/cached";
import { proxyPublicRequest } from "@/server/backend/proxy";

/**
 * The YEE instrument definition is public — no auth required. Cached under
 * the "yee-instrument" tag; admin instrument mutations expire it.
 */
export async function GET() {
	try {
		const data = await fetchPublicCached("/yee/instrument", "yee-instrument");
		return NextResponse.json(data);
	} catch {
		// Backend error — fall back to the uncached proxy so the client gets
		// the real status code instead of a cached failure.
		return proxyPublicRequest({ path: "/yee/instrument" });
	}
}
