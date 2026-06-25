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
  submission_id?: string | null;
  project_id: string;
  project_name: string;
  place_id: string;
  place: string;
  auditor: string;
  date: string;
  submitted_at?: string | null;
  score: number;
  total_raw_score: number;
  total_weighted_score: number;
  domain_weights: Record<string, number>;
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

export type ProjectProfilePayload = {
  name: string;
  description?: string;
  place_types?: string[];
  start_date?: string;
  end_date?: string;
  estimated_places?: number;
  auditor_population_types?: string[];
  auditor_inclusion_exclusion_criteria?: string;
  auditor_notes?: string;
};

export type PlaceProfilePayload = {
  project_id: string;
  name: string;
  address: string;
  city?: string;
  province?: string;
  country?: string;
  postal_code?: string;
  place_type?: string;
  start_date?: string;
  end_date?: string;
  estimated_auditors?: number;
  auditor_population_types?: string[];
  auditor_inclusion_exclusion_criteria?: string;
  auditor_notes?: string;
  lat?: number;
  lng?: number;
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
  assigned_auditors: string[];
  audits: number;
  last_audit: string;
  status: string;
};

export type AuditorRecord = {
  id: string;
  name: string;
  auditor_id: string;
  email: string;
  assigned_places: string[];
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

export type InstrumentVersionRecord = {
  id: string;
  instrument_key: string;
  instrument_version: string;
  is_active: boolean;
  content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type InstrumentCreatePayload = {
  instrument_key: string;
  instrument_version: string;
  content: Record<string, unknown>;
};

export type SiteCopyVersionRecord = {
  id: string;
  instrument_key: string;
  instrument_version: string;
  is_active: boolean;
  content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
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

export type ManagerInviteRecord = {
  id: string;
  email: string;
  status: string;
  expires_at: string;
  invite_url?: string | null;
  created_at?: string | null;
  accepted_at?: string | null;
};

export type ManagerProfileRecord = {
  id: string;
  full_name: string;
  email: string;
  job_title?: string | null;
  profession_disciplines: string[];
  organization?: string | null;
  phone_number?: string | null;
  manager_type: string;
  date_joined: string;
  account_creation_date?: string | null;
  profile_completed: boolean;
};

export type CreateSelfAuditorProfileRecord = {
  id: string;
  auditor_id: string;
  email?: string | null;
  full_name: string;
  account_id: string;
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
  domain_weights: Record<string, number>;
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
  place_types: string[];
  start_date?: string | null;
  end_date?: string | null;
  estimated_places?: number | null;
  auditor_population_types: string[];
  auditor_inclusion_exclusion_criteria: string;
  auditor_notes: string;
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
  city: string;
  province: string;
  country: string;
  postal_code?: string | null;
  place_type: string;
  start_date?: string | null;
  end_date?: string | null;
  estimated_auditors?: number | null;
  auditor_population_types: string[];
  auditor_inclusion_exclusion_criteria: string;
  auditor_notes: string;
  lat?: number | null;
  lng?: number | null;
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
  organization: string;
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
  domain_weights: Record<string, number>;
  responses: Record<string, string>;
};

/**
 * Authenticated fetch for Next.js route handlers.
 * The HttpOnly session cookie is sent automatically by the browser — no
 * Authorization header is needed or emitted from client-side code.
 *
 * The `_session` parameter is kept as an authenticated-user guard so callers
 * can short-circuit before making the request when there is no active session.
 */
async function authedFetch<T>(
  path: string,
  _session: FrontendSession,
  init?: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown }
): Promise<T> {
  const response = await fetch(path, {
    method: init?.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    ...(init?.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    cache: "no-store",
  });
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

export function fetchDashboardOverview(session: FrontendSession) {
  return authedFetch<DashboardOverview>("/api/dashboard/overview", session);
}

export function fetchProjects(session: FrontendSession) {
  return authedFetch<ProjectRecord[]>("/api/dashboard/projects", session);
}

export function fetchProjectDetail(session: FrontendSession, projectId: string) {
  return authedFetch<ProjectDetailRecord>(`/api/dashboard/projects/${encodeURIComponent(projectId)}`, session);
}

export function fetchPlaces(session: FrontendSession) {
  return authedFetch<PlaceRecord[]>("/api/dashboard/places", session);
}

export function fetchPlaceDetail(session: FrontendSession, placeId: string) {
  return authedFetch<PlaceDetailRecord>(`/api/dashboard/places/${encodeURIComponent(placeId)}`, session);
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

export function fetchInstrumentVersions(
  session: FrontendSession,
  instrumentKey = "yee"
) {
  return authedFetch<InstrumentVersionRecord[]>(
    `/api/admin/instruments?instrument_key=${encodeURIComponent(instrumentKey)}`,
    session
  );
}

export function createInstrumentVersion(
  session: FrontendSession,
  payload: InstrumentCreatePayload,
  activate = true
) {
  return authedFetch<InstrumentVersionRecord>(
    `/api/admin/instruments?activate=${activate ? "true" : "false"}`,
    session,
    { method: "POST", body: payload }
  );
}

export function updateInstrumentStatus(
  session: FrontendSession,
  instrumentId: string,
  payload: { is_active: boolean }
) {
  return authedFetch<InstrumentVersionRecord>(
    `/api/admin/instruments/${encodeURIComponent(instrumentId)}`,
    session,
    { method: "PATCH", body: payload }
  );
}

export function deleteInstrumentVersion(session: FrontendSession, instrumentId: string) {
  return authedFetch<{ deleted: boolean; instrument_id: string }>(
    `/api/admin/instruments/${encodeURIComponent(instrumentId)}`,
    session,
    { method: "DELETE" }
  );
}

export function fetchSiteCopyVersions(session: FrontendSession) {
  return authedFetch<SiteCopyVersionRecord[]>("/api/admin/site-copy", session);
}

export function createSiteCopyVersion(
  session: FrontendSession,
  payload: { instrument_version: string; content: Record<string, unknown> },
  activate = true
) {
  return authedFetch<SiteCopyVersionRecord>(
    `/api/admin/site-copy?activate=${activate ? "true" : "false"}`,
    session,
    { method: "POST", body: payload }
  );
}

export function updateSiteCopyStatus(
  session: FrontendSession,
  copyId: string,
  payload: { is_active: boolean }
) {
  return authedFetch<SiteCopyVersionRecord>(
    `/api/admin/site-copy/${encodeURIComponent(copyId)}`,
    session,
    { method: "PATCH", body: payload }
  );
}

export function approveUser(
  session: FrontendSession,
  payload: { user_id: string; account_id?: string }
) {
  return authedFetch<UserRecord>("/api/dashboard/users", session, {
    method: "POST",
    body: payload,
  });
}

export function createProject(session: FrontendSession, payload: ProjectProfilePayload) {
  return authedFetch<ProjectRecord>("/api/dashboard/projects", session, {
    method: "POST",
    body: payload,
  });
}

export function updateProject(
  session: FrontendSession,
  projectId: string,
  payload: ProjectProfilePayload
) {
  return authedFetch<ProjectRecord>(
    `/api/dashboard/projects/${encodeURIComponent(projectId)}`,
    session,
    { method: "PATCH", body: payload }
  );
}

export function createPlace(session: FrontendSession, payload: PlaceProfilePayload) {
  return authedFetch<PlaceRecord>("/api/dashboard/places", session, {
    method: "POST",
    body: payload,
  });
}

export function updatePlace(
  session: FrontendSession,
  placeId: string,
  payload: PlaceProfilePayload
) {
  return authedFetch<PlaceRecord>(
    `/api/dashboard/places/${encodeURIComponent(placeId)}`,
    session,
    { method: "PATCH", body: payload }
  );
}

export function createAuditorInvite(session: FrontendSession, payload: { email: string }) {
  return authedFetch<AuditorInviteRecord>("/api/dashboard/auditor-invites", session, {
    method: "POST",
    body: payload,
  });
}

export function createManagerInvite(
  session: FrontendSession,
  payload: { full_name: string; email: string }
) {
  return authedFetch<ManagerInviteRecord>("/api/dashboard/manager-invites", session, {
    method: "POST",
    body: payload,
  });
}

export function fetchManagerProfile(session: FrontendSession) {
  return authedFetch<ManagerProfileRecord>("/api/dashboard/manager-profile", session);
}

export function updateManagerProfile(
  session: FrontendSession,
  payload: {
    full_name: string;
    job_title: string;
    profession_disciplines: string[];
    organization: string;
    phone_number?: string;
  }
) {
  return authedFetch<ManagerProfileRecord>("/api/dashboard/manager-profile", session, {
    method: "PUT",
    body: payload,
  });
}

export function fetchManagers(session: FrontendSession) {
  return authedFetch<ManagerProfileRecord[]>("/api/dashboard/managers", session);
}

export function removeManager(session: FrontendSession, managerProfileId: string) {
  return authedFetch<null>(
    `/api/dashboard/managers/${encodeURIComponent(managerProfileId)}`,
    session,
    { method: "DELETE" }
  );
}

export function createMyAuditorProfile(session: FrontendSession) {
  return authedFetch<CreateSelfAuditorProfileRecord>(
    "/api/dashboard/my-auditor-profile",
    session,
    { method: "POST" }
  );
}

export function fetchManagerInvites(session: FrontendSession) {
  return authedFetch<ManagerInviteRecord[]>("/api/dashboard/manager-invites", session);
}

export function resendManagerInvite(session: FrontendSession, inviteId: string) {
  return authedFetch<ManagerInviteRecord>(
    `/api/dashboard/manager-invites/${encodeURIComponent(inviteId)}/resend`,
    session,
    { method: "POST" }
  );
}

export function revokeManagerInvite(session: FrontendSession, inviteId: string) {
  return authedFetch<null>(
    `/api/dashboard/manager-invites/${encodeURIComponent(inviteId)}`,
    session,
    { method: "DELETE" }
  );
}

export function createAssignment(
  session: FrontendSession,
  payload: { project_id: string; auditor_ids: string[]; place_ids: string[] }
) {
  return authedFetch<AssignmentRecord>("/api/dashboard/assignments", session, {
    method: "POST",
    body: payload,
  });
}

export function deleteAssignment(
  session: FrontendSession,
  payload: { project_id: string; auditor_id: string; place_id?: string }
) {
  return authedFetch<{ deleted_count: number }>("/api/dashboard/assignments", session, {
    method: "DELETE",
    body: payload,
  });
}

export function fetchMyPlaces(session: FrontendSession) {
  return authedFetch<AssignedPlaceRecord[]>("/api/dashboard/my-places", session);
}

export function fetchPlaceComparisons(session: FrontendSession) {
  return authedFetch<PlaceComparisonGroupRecord[]>(
    "/api/dashboard/reports/place-comparisons",
    session
  );
}

export function fetchRawData(session: FrontendSession) {
  return authedFetch<RawDataRecord[]>("/api/dashboard/raw-data", session);
}
