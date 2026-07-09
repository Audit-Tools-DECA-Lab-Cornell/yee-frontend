"use client";

import * as Sentry from "@sentry/nextjs";
import { PostHogProvider, usePostHog } from "@posthog/react";
import { usePathname, useSearchParams } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/features/auth/components/auth-provider";
import { POSTHOG_HOST, POSTHOG_KEY, isPostHogEnabled } from "@/lib/analytics/config";

/**
 * App-wide product analytics + error-monitoring wiring.
 *
 * - PostHog captures product events and full-fidelity session replays.
 * - Sentry (initialised separately in `instrumentation-client.ts`) receives the
 *   identified user so crashes are attributable.
 *
 * When PostHog is not configured (no `NEXT_PUBLIC_POSTHOG_KEY`) the provider is
 * a transparent pass-through — only the Sentry user sync runs — so local dev and
 * key-less preview builds are unaffected.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
	if (!isPostHogEnabled) {
		return (
			<>
				<SentryUserSync />
				{children}
			</>
		);
	}

	return (
		<PostHogProvider
			apiKey={POSTHOG_KEY}
			options={{
				// Route ingestion through the Next.js reverse proxy to avoid ad blockers.
				api_host: "/ingest",
				ui_host: "https://us.posthog.com",
				defaults: "2026-01-30",
				// App Router: pageviews are captured manually below so client-side
				// navigations are tracked (autocapture only sees the first load).
				capture_pageview: false,
				capture_pageleave: true,
				capture_exceptions: true,
				// Session replay is toggled on in the PostHog project settings; here
				// we opt into FULL fidelity — no text/input masking — per product
				// decision for the pilot. Revisit if PII/compliance concerns arise.
				session_recording: {
					maskAllInputs: false,
					maskTextSelector: undefined
				},
				persistence: "localStorage+cookie",
				debug: process.env.NODE_ENV === "development"
			}}>
			<AnalyticsIdentitySync />
			<React.Suspense fallback={null}>
				<PageViewTracker />
			</React.Suspense>
			{children}
		</PostHogProvider>
	);
}

/**
 * Keeps PostHog + Sentry identity in sync with the auth session.
 * Identifies on login (or restored session) and resets on logout only, so
 * anonymous funnel continuity on public pages is preserved.
 */
function AnalyticsIdentitySync() {
	const posthog = usePostHog();
	const { session } = useAuth();
	const lastIdentifiedId = React.useRef<string | null>(null);

	React.useEffect(() => {
		const user = session?.user ?? null;

		if (user) {
			if (lastIdentifiedId.current !== user.id) {
				posthog.identify(user.id, {
					email: user.email,
					name: user.name ?? undefined,
					role: user.account_type,
					account_id: user.account_id ?? undefined,
					organization: user.organization ?? undefined
				});
				lastIdentifiedId.current = user.id;
			}
			Sentry.setUser({ id: user.id, email: user.email });
		} else if (lastIdentifiedId.current !== null) {
			// Only reset after we had identified someone (a real logout), never on
			// the initial anonymous render.
			posthog.reset();
			Sentry.setUser(null);
			lastIdentifiedId.current = null;
		}
	}, [session, posthog]);

	return null;
}

/** Sentry-only user sync used when PostHog is disabled. */
function SentryUserSync() {
	const { session } = useAuth();

	React.useEffect(() => {
		const user = session?.user ?? null;
		Sentry.setUser(user ? { id: user.id, email: user.email } : null);
	}, [session]);

	return null;
}

/**
 * Fires a PostHog `$pageview` on every App Router navigation. Must live inside a
 * `<Suspense>` boundary because `useSearchParams()` opts the subtree into
 * client-side rendering under Next 16 Cache Components.
 */
function PageViewTracker() {
	const posthog = usePostHog();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	React.useEffect(() => {
		if (!pathname) return;
		let url = window.origin + pathname;
		const query = searchParams?.toString();
		if (query) url += `?${query}`;
		posthog.capture("$pageview", { $current_url: url });
	}, [pathname, searchParams, posthog]);

	return null;
}
