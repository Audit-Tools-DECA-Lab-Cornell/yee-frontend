// Sentry browser SDK initialisation (Next.js App Router instrumentation-client).
// A no-op when NEXT_PUBLIC_SENTRY_DSN is unset — safe for key-less builds.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	// Capture a sample of performance traces. Full sampling in dev; light in prod.
	tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.2,
	// Session replay is handled by PostHog; keep Sentry replay off to avoid
	// double-recording.
	replaysSessionSampleRate: 0,
	replaysOnErrorSampleRate: 0,
	enableLogs: true,
	sendDefaultPii: true
});

// Instruments App Router client-side navigations for tracing (Next 16).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
