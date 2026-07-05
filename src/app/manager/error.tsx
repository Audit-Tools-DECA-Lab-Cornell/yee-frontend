"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return (
		<ErrorState
			title="We couldn't load this page"
			description="Something went wrong while loading your workspace. Try again, and if it keeps happening, reach out to your YEE contact."
			error={error}
			onRetry={reset}
			action={{ label: "Back to overview", href: "/manager" }}
		/>
	);
}
