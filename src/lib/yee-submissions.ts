"use client";

import type { FrontendSession } from "@/lib/auth/session";

export type MyYeeAuditRecord = {
	id: string;
	place_id: string;
	place_name: string;
	submitted_at: string;
	total_score: number;
};

export async function fetchMyYeeAudits(session: FrontendSession): Promise<MyYeeAuditRecord[]> {
	const response = await fetch("/api/yee/my-audits", {
		headers: {
			Authorization: `Bearer ${session.accessToken}`
		},
		cache: "no-store"
	});
	const text = await response.text();
	const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
	if (!response.ok) {
		const detail =
			typeof data.detail === "string"
				? data.detail
				: typeof data.error === "string"
					? data.error
					: "Request failed.";
		throw new Error(detail);
	}
	return data as unknown as MyYeeAuditRecord[];
}
