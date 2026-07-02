import { NextResponse } from "next/server";

import { fetchPublicCached } from "@/server/backend/cached";
import { proxyPublicRequest } from "@/server/backend/proxy";

/**
 * Site copy is publicly readable — no auth required. Cached under the
 * "site-copy" tag; admin site-copy mutations expire it.
 */
export async function GET() {
	try {
		const data = await fetchPublicCached("/yee/site-copy", "site-copy");
		return NextResponse.json(data);
	} catch {
		// Backend error — fall back to the uncached proxy so the client gets
		// the real status code instead of a cached failure.
		return proxyPublicRequest({ path: "/yee/site-copy" });
	}
}
