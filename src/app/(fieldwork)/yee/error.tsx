"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function YeeError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return (
		<ErrorState
			title="We couldn't load this report"
			description="You may not have access to this submission, or it may still be processing. Try again, or head back to where you came from."
			error={error}
			onRetry={reset}
			secondaryAction={{ label: "Go back", onClick: () => window.history.back() }}
		/>
	);
}
