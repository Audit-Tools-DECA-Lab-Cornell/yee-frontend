"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuditorDashboardError({ error, reset }: { error: Error; reset: () => void }) {
	return (
		<div className="flex min-h-full items-center justify-center">
			<Card className="w-full max-w-md rounded-md gap-2 border-rose-200 shadow-sm">
				<CardHeader>
					<CardTitle className="text-rose-800">Auditor dashboard error</CardTitle>
					<CardDescription className="text-rose-700">
						Something went wrong while loading your dashboard.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<code className="text-sm text-rose-700 bg-rose-100 p-2 rounded-sm block">{error.message}</code>
					<Button
						type="button"
						onClick={reset}
						className="rounded-sm bg-rose-700 text-white hover:bg-rose-800">
						Try again
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
