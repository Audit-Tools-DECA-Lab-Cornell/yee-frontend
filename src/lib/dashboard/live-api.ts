"use client";

import type { FrontendSession } from "@/lib/auth/session";

export type DashboardMetric = {
	title: string;
	value: string;
	description: string;
	trend: string;
};

export type AuditRecord = {
	id: string;
	project_id: string;
	project_name: string;
	place_id: string;
	place: string;
	auditor: string;
	date: string;
	score: number;
	status: string;
};

export type ProjectRecord = {
	id: string;
	name: string;
	summary: string;
	organization?: string | null;
	places: number;
	audits: number;
	status: string;
};

export type ProjectPlaceRecord = {
	id: string;
	name: string;
	address: string;
	audits: number;
	last_audit: string;
	status: string;
};

export type PlaceRecord = {
	id: string;
	name: string;
	project_id: string;
	project: string;
	organization?: string | null;
	address: string;
	postal_code?: string | null;
	audits: number;
	last_audit: string;
	status: string;
};

export type AuditorRecord = {
	id: string;
	name: string;
	email: string;
	assigned_places: number;
	completed_audits: number;
	status: string;
};

export type ProjectAuditorRecord = {
	id: string;
	name: string;
	auditor_id: string;
	assigned_places: number;
	completed_audits: number;
	status: string;
};

export type UserRecord = {
	id: string;
	name: string;
	email: string;
	role: string;
	account_id: string | null;
	organization: string;
	status: string;
	approved: boolean;
	email_verified: boolean;
	profile_completed: boolean;
	contact_info: string;
	project_assignments: string;
};

export type DashboardOverview = {
	metrics: DashboardMetric[];
	recent_activity: string[];
	latest_audits: AuditRecord[];
	organization_summaries: {
		organization: string;
		users: number;
		projects: number;
		places: number;
		audits: number;
	}[];
};

export type AuditorInviteRecord = {
	id: string;
	email: string;
	status: string;
	expires_at: string;
	invite_url: string;
};

export type AssignmentRecord = {
	created_count: number;
	existing_count: number;
	assignments: {
		id: string;
		auditor_id: string;
		place_id: string;
		project_id: string;
	}[];
};

export type AssignedPlaceRecord = {
	id: string;
	name: string;
	project: string;
	address: string;
	audits: number;
};

export type PlaceAuditorRecord = {
	id: string;
	name: string;
	auditor_id: string;
	status: string;
	audit_count: number;
	last_audit: string;
};

export type ComparisonDomainScores = {
	access: number;
	activitySpaces: number;
	amenities: number;
	experienceOfSpace: number;
	aestheticsAndCare: number;
	useAndUsability: number;
};

export type PlaceComparisonAuditRecord = {
	audit_id: string;
	auditor_id: string;
	place_id: string;
	place_name: string;
	project_id: string;
	project_name: string;
	date: string;
	total_raw_score: number;
	total_weighted_score: number;
	raw_domain_scores: ComparisonDomainScores;
	weighted_domain_scores: ComparisonDomainScores;
};

export type PlaceComparisonGroupRecord = {
	place_id: string;
	place_name: string;
	project_id: string;
	project_name: string;
	audits: PlaceComparisonAuditRecord[];
};

export type ProjectDetailRecord = {
	id: string;
	name: string;
	description: string;
	status: string;
	organization: string;
	total_places: number;
	total_audits: number;
	submitted_audits: number;
	assigned_auditors: number;
	places: ProjectPlaceRecord[];
	auditors: ProjectAuditorRecord[];
	latest_audits: AuditRecord[];
};

export type PlaceDetailRecord = {
	id: string;
	name: string;
	address: string;
	postal_code?: string | null;
	notes: string;
	status: string;
	project_id: string;
	project_name: string;
	assigned_auditors: number;
	total_audits: number;
	submitted_audits: number;
	last_audit: string;
	auditors: PlaceAuditorRecord[];
	comparisons: PlaceComparisonGroupRecord;
};

export type RawDataRecord = {
	audit_id: string;
	auditor_generated_id: string;
	place_id: string;
	place_name: string;
	project_id: string;
	project_name: string;
	date: string;
	submitted_at: string;
	start_time: string;
	finish_time: string;
	total_minutes: number;
	visit_frequency: string;
	season: string;
	weather: string;
	comments: string;
	raw_access: number;
	raw_activity_spaces: number;
	raw_amenities: number;
	raw_experience_of_space: number;
	raw_aesthetics_and_care: number;
	raw_use_and_usability: number;
	weighted_access: number;
	weighted_activity_spaces: number;
	weighted_amenities: number;
	weighted_experience_of_space: number;
	weighted_aesthetics_and_care: number;
	weighted_use_and_usability: number;
	total_raw_score: number;
	total_weighted_score: number;
	responses: Record<string, string>;
};

async function authedFetch<T>(
	path: string,
	session: FrontendSession,
	init?: { method?: "GET" | "POST"; body?: unknown }
): Promise<T> {
	const response = await fetch(path, {
		method: init?.method ?? "GET",
		headers: {
			Authorization: `Bearer ${session.accessToken}`,
			"Content-Type": "application/json"
		},
		...(init?.body === undefined ? {} : { body: JSON.stringify(init.body) }),
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
	return data as T;
}

export function fetchDashboardOverview(session: FrontendSession) {
	return authedFetch<DashboardOverview>("/api/dashboard/overview", session);
}

export function fetchProjects(session: FrontendSession) {
	return authedFetch<ProjectRecord[]>("/api/dashboard/projects", session);
}

export function fetchProjectDetail(session: FrontendSession, projectId: string) {
	return authedFetch<ProjectDetailRecord>(`/api/dashboard/projects/${projectId}`, session);
}

export function fetchPlaces(session: FrontendSession) {
	return authedFetch<PlaceRecord[]>("/api/dashboard/places", session);
}

export function fetchPlaceDetail(session: FrontendSession, placeId: string) {
	return authedFetch<PlaceDetailRecord>(`/api/dashboard/places/${placeId}`, session);
}

export function fetchAuditors(session: FrontendSession) {
	return authedFetch<AuditorRecord[]>("/api/dashboard/auditors", session);
}

export function fetchAudits(session: FrontendSession) {
	return authedFetch<AuditRecord[]>("/api/dashboard/audits", session);
}

export function fetchUsers(session: FrontendSession) {
	return authedFetch<UserRecord[]>("/api/dashboard/users", session);
}

export function approveUser(
	session: FrontendSession,
	payload: { user_id: string; account_id?: string }
) {
	return authedFetch<UserRecord>("/api/dashboard/users", session, {
		method: "POST",
		body: payload
	});
}

export function createProject(
	session: FrontendSession,
	payload: { name: string; description?: string }
) {
	return authedFetch<ProjectRecord>("/api/dashboard/projects", session, {
		method: "POST",
		body: payload
	});
}

export function createPlace(
	session: FrontendSession,
	payload: { project_id: string; name: string; address: string; postal_code?: string; notes?: string }
) {
	return authedFetch<PlaceRecord>("/api/dashboard/places", session, {
		method: "POST",
		body: payload
	});
}

export function createAuditorInvite(session: FrontendSession, payload: { email: string }) {
	return authedFetch<AuditorInviteRecord>("/api/dashboard/auditor-invites", session, {
		method: "POST",
		body: payload
	});
}

export function createAssignment(
	session: FrontendSession,
	payload: { project_id: string; auditor_ids: string[]; place_ids: string[] }
) {
	return authedFetch<AssignmentRecord>("/api/dashboard/assignments", session, {
		method: "POST",
		body: payload
	});
}

export function fetchMyPlaces(session: FrontendSession) {
	return authedFetch<AssignedPlaceRecord[]>("/api/dashboard/my-places", session);
}

export function fetchPlaceComparisons(session: FrontendSession) {
	return authedFetch<PlaceComparisonGroupRecord[]>("/api/dashboard/reports/place-comparisons", session);
}

export function fetchRawData(session: FrontendSession) {
	return authedFetch<RawDataRecord[]>("/api/dashboard/raw-data", session);
}
