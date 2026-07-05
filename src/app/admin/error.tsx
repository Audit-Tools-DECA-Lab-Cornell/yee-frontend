"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return (
		<ErrorState
			title="We couldn't load this page"
			description="Something went wrong while loading the admin area. Try again, and if it keeps happening, reach out to support."
			error={error}
			onRetry={reset}
			action={{ label: "Back to overview", href: "/admin" }}
		/>
	);
}
