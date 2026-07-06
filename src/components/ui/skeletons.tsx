import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Content-shaped loading skeletons. These replace the old spinner+text loaders
 * so a client component's loading state matches the route-level `loading.tsx`
 * skeleton — one continuous skeleton instead of "skeleton flash → spinner".
 */

/** A table card: header rule + N rows of cells. The default list-loading state. */
function TableSkeleton({
	rows = 6,
	columns = 4,
	className,
	"aria-label": ariaLabel = "Loading",
	...props
}: React.HTMLAttributes<HTMLDivElement> & { rows?: number; columns?: number }) {
	return (
		<div
			className={cn("overflow-hidden rounded-md border border-border bg-card", className)}
			role="status"
			aria-busy="true"
			aria-label={ariaLabel}
			{...props}>
			<div className="border-b border-border px-4 py-3.5">
				<Skeleton className="h-4 w-40" />
			</div>
			<div className="divide-y divide-border">
				{Array.from({ length: rows }).map((_, rowIndex) => (
					<div key={rowIndex} className="flex items-center gap-4 px-4 py-4">
						{Array.from({ length: columns }).map((_, colIndex) => (
							<Skeleton
								key={colIndex}
								className={cn(
									"h-4",
									colIndex === 0 ? "w-[22%]" : colIndex === columns - 1 ? "ml-auto w-14" : "w-[14%]"
								)}
							/>
						))}
					</div>
				))}
			</div>
		</div>
	);
}

/** A grid of stat-card skeletons — for dashboard overviews. */
function StatCardsSkeleton({ count = 4, className }: { count?: number; className?: string }) {
	return (
		<div
			className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-4", className)}
			role="status"
			aria-busy="true"
			aria-label="Loading">
			{Array.from({ length: count }).map((_, index) => (
				<Card key={index}>
					<CardContent className="space-y-3">
						<Skeleton className="h-3 w-24" />
						<Skeleton className="h-8 w-16" />
						<Skeleton className="h-3 w-32" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}

/** A short form/detail skeleton — a few stacked field rows inside a card. */
function FormSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
	return (
		<div className={cn("space-y-4", className)} role="status" aria-busy="true" aria-label="Loading">
			{Array.from({ length: rows }).map((_, index) => (
				<div key={index} className="space-y-2">
					<Skeleton className="h-3.5 w-28" />
					<Skeleton className="h-9 w-full" />
				</div>
			))}
		</div>
	);
}

export { TableSkeleton, StatCardsSkeleton, FormSkeleton };
