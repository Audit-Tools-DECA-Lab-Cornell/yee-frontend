import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export function getPostHogServerClient(): PostHog {
	if (!posthogClient) {
		posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
			host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
			// Flush immediately — Next.js route handlers are short-lived.
			flushAt: 1,
			flushInterval: 0
		});
	}
	return posthogClient;
}
