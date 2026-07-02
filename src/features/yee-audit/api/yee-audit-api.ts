"use client";

import type { BackendScoreResponse } from "@/features/yee-audit/scoring/yee-scoring";

export type YeeAuditState = {
	audit_id: string | null;
	submission_id: string | null;
	place_id: string;
	place_name: string;
	auditor_generated_id: string;
	status: "NOT_STARTED" | "DRAFT" | "SUBMITTED";
	submitted_at: string | null;
	participant_info: Record<string, unknown>;
	responses: Record<string, string | Record<string, string>>;
	score: BackendScoreResponse | null;
};

export type YeeSubmissionRecord = {
	id: string;
	place_id: string;
	place_name: string | null;
	auditor_id: string;
	auditor_generated_id: string | null;
	submitted_at: string;
	participant_info: Record<string, unknown>;
	responses: Record<string, string | Record<string, string>>;
	score: BackendScoreResponse;
};

export type ManagerAuditEditState = {
	audit_id: string;
	submission_id: string | null;
	place_id: string;
	place_name: string | null;
	auditor_id: string;
	auditor_generated_id: string | null;
	submitted_at: string | null;
	participant_info: Record<string, unknown>;
	responses: Record<string, string | Record<string, string>>;
	score: BackendScoreResponse;
};

type SaveDraftPayload = {
	participant_info: Record<string, unknown>;
	responses: Record<string, string | Record<string, string>>;
};

async function readJsonOrThrow<T>(response: Response): Promise<T> {
	const text = await response.text();
	const data: unknown = text ? JSON.parse(text) : {};
	if (!response.ok) {
		const record = data as Record<string, unknown>;
		const detail =
			typeof record.detail === "string"
				? record.detail
				: typeof record.error === "string"
					? record.error
					: "Request failed.";
		throw new Error(detail);
	}
	return data as T;
}

/**
 * Cookie-based auth: the HttpOnly session cookie is sent automatically by the
 * browser to the Next.js route handlers, which then forward it server-side to
 * the backend. No Authorization header is needed from client code.
 */
export async function fetchAuditState(placeId: string): Promise<YeeAuditState> {
	const response = await fetch(`/api/yee/places/${encodeURIComponent(placeId)}/audit-state`, { cache: "no-store" });
	return readJsonOrThrow<YeeAuditState>(response);
}

export async function saveAuditDraft(placeId: string, payload: SaveDraftPayload): Promise<YeeAuditState> {
	const response = await fetch(`/api/yee/places/${encodeURIComponent(placeId)}/audit-state`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload)
	});
	return readJsonOrThrow<YeeAuditState>(response);
}

export async function fetchSubmission(submissionId: string): Promise<YeeSubmissionRecord> {
	const response = await fetch(`/api/yee/audits/${encodeURIComponent(submissionId)}`, { cache: "no-store" });
	return readJsonOrThrow<YeeSubmissionRecord>(response);
}

export async function fetchManagerAuditEditState(auditId: string): Promise<ManagerAuditEditState> {
	const response = await fetch(`/api/dashboard/audits/${encodeURIComponent(auditId)}/edit`, { cache: "no-store" });
	return readJsonOrThrow<ManagerAuditEditState>(response);
}

export async function updateManagerAuditEditState(
	auditId: string,
	payload: SaveDraftPayload & { resubmit?: boolean; submission_id?: string | null }
): Promise<ManagerAuditEditState> {
	const response = await fetch(`/api/dashboard/audits/${encodeURIComponent(auditId)}/edit`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload)
	});
	return readJsonOrThrow<ManagerAuditEditState>(response);
}
