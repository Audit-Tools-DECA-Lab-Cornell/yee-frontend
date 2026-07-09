/**
 * Central analytics configuration.
 *
 * Reads the public PostHog + Sentry keys from `NEXT_PUBLIC_*` env vars so both
 * the client provider and Sentry init share one source of truth. Everything is
 * a no-op when a key is absent, so local dev and preview builds without keys
 * behave exactly as before.
 */

/** PostHog project API key (client-visible). Empty string when unconfigured. */
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";

/** PostHog ingestion host, e.g. https://us.i.posthog.com. */
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

/** Sentry browser DSN (client-visible). Empty string disables Sentry. */
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";

/** Whether PostHog product analytics + session replay should initialise. */
export const isPostHogEnabled = POSTHOG_KEY.length > 0;

/** Whether Sentry error monitoring should initialise. */
export const isSentryEnabled = SENTRY_DSN.length > 0;
