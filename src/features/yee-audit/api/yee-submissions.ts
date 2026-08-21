"use client";

import { ApiError, readErrorMessage } from "@/lib/api/client";

export type MyYeeAuditRecord = {
	id: string;
	place_id: string;
	place_name: string;
	submitted_at: string;
	total_score: number;
	participant_id?: string | null;
};

/**
 * Fetches the auditor's own audit records.
 * Cookie-based auth: the HttpOnly session cookie is forwarded automatically.
 */
export async function fetchMyYeeAudits(): Promise<MyYeeAuditRecord[]> {
	const response = await fetch("/api/yee/my-audits", { cache: "no-store" });
	const text = await response.text();
	const data: unknown = text ? JSON.parse(text) : {};
	if (!response.ok) {
		throw new ApiError(response.status, readErrorMessage(data, response.status), data);
	}
	return data as MyYeeAuditRecord[];
}
