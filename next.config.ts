import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	cacheComponents: true,
	// PostHog reverse proxy — routes ingestion through the app origin to avoid ad blockers.
	async rewrites() {
		return [
			{
				source: "/ingest/static/:path*",
				destination: "https://us-assets.i.posthog.com/static/:path*"
			},
			{
				source: "/ingest/array/:path*",
				destination: "https://us-assets.i.posthog.com/array/:path*"
			},
			{
				source: "/ingest/:path*",
				destination: "https://us.i.posthog.com/:path*"
			}
		];
	},
	// Required to support PostHog trailing-slash API requests.
	skipTrailingSlashRedirect: true,
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "maps.googleapis.com"
			},
			{
				protocol: "https",
				hostname: "staticmap.openstreetmap.de"
			},
			{
				protocol: "https",
				hostname: "maps.wikimedia.org"
			}
		]
	}
};

// Wrap with Sentry so source maps upload at build time (only when
// SENTRY_AUTH_TOKEN is present) and client requests can tunnel past ad blockers.
export default withSentryConfig(nextConfig, {
	org: process.env.SENTRY_ORG,
	project: process.env.SENTRY_PROJECT,
	authToken: process.env.SENTRY_AUTH_TOKEN,
	// Route Sentry ingestion through the app origin to dodge ad blockers.
	tunnelRoute: "/monitoring",
	// Quiet the plugin locally; verbose only in CI.
	silent: !process.env.CI
});
