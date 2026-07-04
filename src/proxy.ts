import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/cookies";
import type { UserRole, SessionUser } from "@/types/auth";

/**
 * Route prefix → allowed roles mapping.
 * Middleware checks these BEFORE the page renders, so unauthenticated users
 * never receive protected HTML. AuthGuard is a secondary UX layer only.
 */
const PROTECTED_ROUTES: Record<string, UserRole[]> = {
	"/admin": ["ADMIN"],
	"/manager": ["MANAGER"],
	"/auditor": ["AUDITOR", "MANAGER"],
	"/yee/audit": ["AUDITOR", "MANAGER"],
	"/yee/introduction": ["AUDITOR", "MANAGER"],
	"/yee/submissions": ["AUDITOR", "MANAGER", "ADMIN"]
};

function matchedRoute(pathname: string): UserRole[] | null {
	for (const [prefix, roles] of Object.entries(PROTECTED_ROUTES)) {
		if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
			return roles;
		}
	}
	return null;
}

function hasRoleAccess(user: SessionUser, allowedRoles: UserRole[]): boolean {
	if (allowedRoles.includes(user.account_type)) return true;
	// A manager with an auditor profile may also access AUDITOR routes.
	if (allowedRoles.includes("AUDITOR") && user.account_type === "MANAGER" && user.has_auditor_profile) {
		return true;
	}
	return false;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
	const { pathname } = request.nextUrl;
	const allowedRoles = matchedRoute(pathname);

	// Not a protected route — pass through immediately.
	if (!allowedRoles) return NextResponse.next();

	const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
	if (!sessionCookie?.value) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	try {
		// Validate the cookie by calling the session route handler.
		// This is an intra-process fetch (no external network hop for same-host).
		const sessionUrl = new URL("/api/auth/session", request.url);
		const sessionResponse = await fetch(sessionUrl.toString(), {
			headers: { cookie: `${SESSION_COOKIE_NAME}=${sessionCookie.value}` },
			cache: "no-store"
		});

		if (!sessionResponse.ok) {
			return NextResponse.redirect(new URL("/login", request.url));
		}

		const { user } = (await sessionResponse.json()) as { user: SessionUser };

		// Block users still in the onboarding flow from accessing dashboard pages.
		if (user.next_step !== "DASHBOARD") {
			const onboardingPath = getOnboardingRedirect(user);
			return NextResponse.redirect(new URL(onboardingPath, request.url));
		}

		if (!hasRoleAccess(user, allowedRoles)) {
			return NextResponse.redirect(new URL(user.dashboard_path, request.url));
		}

		return NextResponse.next();
	} catch {
		// Network error reaching the session handler — fail open to login.
		return NextResponse.redirect(new URL("/login", request.url));
	}
}

function getOnboardingRedirect(user: SessionUser): string {
	switch (user.next_step) {
		case "VERIFY_EMAIL":
			return `/verify-email?email=${encodeURIComponent(user.email)}`;
		case "WAITING_APPROVAL":
			return "/waiting-approval";
		case "COMPLETE_PROFILE":
			return "/complete-profile";
		default:
			return "/login";
	}
}

export const config = {
	matcher: ["/admin/:path*", "/manager/:path*", "/auditor/:path*", "/yee/:path*"]
};
