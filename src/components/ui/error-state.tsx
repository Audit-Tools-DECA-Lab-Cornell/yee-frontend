"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ErrorStateAction = {
	label: string;
	href: string;
};

type ErrorStateProps = {
	/** Short, human sentence — what failed, in the user's terms. */
	title?: string;
	/** A likely cause plus reassurance and a next step. */
	description?: string;
	/** The caught error — its message is shown only in development. */
	error?: (Error & { digest?: string }) | null;
	/** Retry handler (e.g. the Next.js route `reset` function). */
	onRetry?: () => void;
	/** Secondary escape hatch link, e.g. back to the dashboard. */
	action?: ErrorStateAction;
	/** Secondary escape hatch handler, e.g. "Go back" via browser history. */
	secondaryAction?: { label: string; onClick: () => void };
	className?: string;
};

/**
 * The humane, branded error surface used by every route error boundary.
 * Never shows a raw stack trace to end users — the technical message is
 * revealed only in development, behind a collapsed disclosure.
 */
function ErrorState({
	title = "Something didn't load",
	description = "Something went wrong on our end. Try again, and if it keeps happening, reach out to your YEE contact.",
	error,
	onRetry,
	action,
	secondaryAction,
	className
}: ErrorStateProps) {
	const showTechnical = process.env.NODE_ENV !== "production" && Boolean(error?.message);

	return (
		<div className={cn("flex min-h-full items-center justify-center p-6", className)}>
			<Card className="w-full max-w-md" elevation="raised">
				<CardHeader>
					<div
						className="flex size-11 items-center justify-center rounded-md bg-destructive/10 text-destructive"
						aria-hidden="true">
						<AlertTriangle className="size-5" />
					</div>
					<CardTitle className="text-lg">{title}</CardTitle>
					<CardDescription className="leading-6">{description}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{onRetry || action || secondaryAction ? (
						<div className="flex flex-wrap gap-3">
							{onRetry ? (
								<Button type="button" onClick={onRetry}>
									Try again
								</Button>
							) : null}
							{action ? (
								<Button asChild variant="outline">
									<Link href={action.href}>{action.label}</Link>
								</Button>
							) : null}
							{secondaryAction ? (
								<Button type="button" variant="outline" onClick={secondaryAction.onClick}>
									{secondaryAction.label}
								</Button>
							) : null}
						</div>
					) : null}
					{showTechnical ? (
						<details className="rounded-sm bg-muted px-3 py-2 text-xs text-muted-foreground">
							<summary className="cursor-pointer font-medium">Technical details (dev only)</summary>
							<code className="mt-2 block break-words whitespace-pre-wrap">{error?.message}</code>
							{error?.digest ? <p className="mt-1">Digest: {error.digest}</p> : null}
						</details>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}

export { ErrorState };
export type { ErrorStateProps };
