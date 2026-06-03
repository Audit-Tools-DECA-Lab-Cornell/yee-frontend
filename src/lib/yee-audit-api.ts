"use client";

import type { FrontendSession } from "@/lib/auth/session";
import type { BackendScoreResponse } from "@/lib/yee-scoring";

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
	return data as T;
}

export async function fetchAuditState(placeId: string, session: FrontendSession): Promise<YeeAuditState> {
	const response = await fetch(`/api/yee/places/${encodeURIComponent(placeId)}/audit-state`, {
		headers: {
			Authorization: `Bearer ${session.accessToken}`
		},
		cache: "no-store"
	});
	return readJsonOrThrow<YeeAuditState>(response);
}

export async function saveAuditDraft(
	placeId: string,
	session: FrontendSession,
	payload: SaveDraftPayload
): Promise<YeeAuditState> {
	const response = await fetch(`/api/yee/places/${encodeURIComponent(placeId)}/audit-state`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${session.accessToken}`
		},
		body: JSON.stringify(payload)
	});
	return readJsonOrThrow<YeeAuditState>(response);
}

export async function fetchSubmission(submissionId: string, session: FrontendSession): Promise<YeeSubmissionRecord> {
	const response = await fetch(`/api/yee/audits/${encodeURIComponent(submissionId)}`, {
		headers: {
			Authorization: `Bearer ${session.accessToken}`
		},
		cache: "no-store"
	});
	return readJsonOrThrow<YeeSubmissionRecord>(response);
}

export async function fetchManagerAuditEditState(auditId: string, session: FrontendSession): Promise<ManagerAuditEditState> {
	const response = await fetch(`/api/dashboard/audits/${encodeURIComponent(auditId)}/edit`, {
		headers: {
			Authorization: `Bearer ${session.accessToken}`
		},
		cache: "no-store"
	});
	return readJsonOrThrow<ManagerAuditEditState>(response);
}

export async function updateManagerAuditEditState(
	auditId: string,
	session: FrontendSession,
	payload: SaveDraftPayload & { resubmit?: boolean; submission_id?: string | null }
): Promise<ManagerAuditEditState> {
	const response = await fetch(`/api/dashboard/audits/${encodeURIComponent(auditId)}/edit`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${session.accessToken}`
		},
		body: JSON.stringify(payload)
	});
	return readJsonOrThrow<ManagerAuditEditState>(response);
}
