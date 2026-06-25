"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function YeeError({
	error,
	reset,
}: {
	error: Error;
	reset: () => void;
}) {
	return (
		<main className="mx-auto max-w-4xl p-6">
			<Card className="rounded-2xl border-rose-200 bg-rose-50 shadow-sm">
				<CardHeader>
					<CardTitle className="text-rose-800">YEE audit error</CardTitle>
					<CardDescription className="text-rose-700">
						Something went wrong in the audit flow.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-rose-700">{error.message}</p>
					<Button
						type="button"
						onClick={reset}
						className="rounded-2xl bg-rose-700 text-white hover:bg-rose-800">
						Try again
					</Button>
				</CardContent>
			</Card>
		</main>
	);
}
