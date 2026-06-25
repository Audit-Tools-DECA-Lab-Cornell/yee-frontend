/** Canonical auth types, shared between server and client without any browser API references. */

export type UserRole = "ADMIN" | "MANAGER" | "AUDITOR";
export type AuthNextStep = "VERIFY_EMAIL" | "WAITING_APPROVAL" | "COMPLETE_PROFILE" | "DASHBOARD";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  account_id: string | null;
  organization: string | null;
  account_type: UserRole;
  is_primary_manager: boolean;
  email_verified: boolean;
  approved: boolean;
  profile_completed: boolean;
  next_step: AuthNextStep;
  dashboard_path: string;
  has_auditor_profile: boolean;
  auditor_dashboard_path: string | null;
};

/**
 * The in-memory session object stored in React state on the client.
 * The raw access token is NEVER stored here; it lives in an HttpOnly cookie
 * managed server-side by the Next.js route handlers.
 */
export type FrontendSession = {
  user: SessionUser;
};
