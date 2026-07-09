// Next.js server bootstrap. Loads the Sentry server/edge config for the active
// runtime and wires request-error capture.
import * as Sentry from "@sentry/nextjs";

export async function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		await import("./sentry.server.config");
	}

	if (process.env.NEXT_RUNTIME === "edge") {
		await import("./sentry.edge.config");
	}
}

// Captures errors thrown while rendering React Server Components / routes.
export const onRequestError = Sentry.captureRequestError;
