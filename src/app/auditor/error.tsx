"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function AuditorDashboardError({
	error,
	reset
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<ErrorState
			title="We couldn't load your dashboard"
			description="This can happen while an audit is still syncing. Try again, and if it keeps happening, reach out to your YEE contact."
			error={error}
			onRetry={reset}
			action={{ label: "Go to my audits", href: "/auditor/places" }}
		/>
	);
}
