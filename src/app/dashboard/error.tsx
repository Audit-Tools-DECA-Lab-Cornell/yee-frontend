"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
	return (
		<div className="flex min-h-dvh items-center justify-center p-6">
			<Card className="w-full max-w-md rounded-2xl border-rose-200 bg-rose-50 shadow-sm">
				<CardHeader>
					<CardTitle className="text-rose-800">Dashboard error</CardTitle>
					<CardDescription className="text-rose-700">
						Something went wrong while loading this page.
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
		</div>
	);
}
