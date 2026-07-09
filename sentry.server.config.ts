// Sentry Node.js (server) SDK initialisation. Loaded via instrumentation.ts.
// A no-op when SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN is unset.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
	tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.2,
	enableLogs: true,
	sendDefaultPii: true
});
