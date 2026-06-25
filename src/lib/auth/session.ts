/**
 * Public re-exports for auth types and routing logic.
 *
 * localStorage storage has been removed — the access token now lives
 * exclusively in an HttpOnly cookie managed by the Next.js route handlers.
 * This file is safe to import from both server and client modules.
 */
export type { AuthNextStep, FrontendSession, SessionUser, UserRole } from "./session-types";

import type { SessionUser } from "./session-types";

/** Returns the correct app route for a user based on their onboarding next_step. */
export function getRouteForUser(user: SessionUser): string {
	switch (user.next_step) {
		case "VERIFY_EMAIL":
			return `/verify-email?email=${encodeURIComponent(user.email)}`;
		case "WAITING_APPROVAL":
			return "/waiting-approval";
		case "COMPLETE_PROFILE":
			return "/complete-profile";
		case "DASHBOARD":
		default:
			return user.dashboard_path;
	}
}
