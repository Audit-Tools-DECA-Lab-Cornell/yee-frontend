import { cacheLife, cacheTag } from "next/cache";

import { getApiBaseUrl } from "./config";
import { parseBackendJson } from "./response";

/**
 * Cached fetch for PUBLIC backend endpoints only (site copy, instrument
 * definition). Role-scoped or authenticated data must never go through this
 * helper — it stays on `proxyRequest` per the caching policy in
 * docs/architecture.md.
 *
 * Non-OK backend responses throw so failures are never written to the cache;
 * callers fall back to the uncached public proxy.
 */
export async function fetchPublicCached(path: string, tag: string): Promise<unknown> {
	"use cache";
	cacheTag(tag);
	cacheLife("hours");

	const response = await fetch(`${getApiBaseUrl()}${path}`, {
		headers: { "Content-Type": "application/json" }
	});
	if (!response.ok) {
		throw new Error(`Backend request for ${path} failed with status ${response.status}`);
	}
	return parseBackendJson(await response.text());
}
