import * as React from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type DataTableWrapperProps = {
	children: React.ReactNode;
	/** Rendered when `isLoading` is true in place of children. */
	loadingRows?: number;
	/** When true, renders the loading skeleton instead of children. */
	isLoading?: boolean;
	/** Rendered when there is no data (pass an EmptyState component). */
	emptyState?: React.ReactNode;
	/** When true, renders the empty state slot. */
	isEmpty?: boolean;
	/** Enables sticky positioning on the first table column. */
	stickyFirstColumn?: boolean;
	className?: string;
};

/** Shimmer row for table loading state. */
function TableSkeletonRow({ columns = 5 }: { columns?: number }) {
	return (
		<tr>
			{Array.from({ length: columns }).map((_, index) => (
				<td key={index} className="px-4 py-3">
					<Skeleton className="h-4 w-full" />
				</td>
			))}
		</tr>
	);
}

/**
 * Horizontal-scroll container for data tables with loading skeleton
 * and empty state support.
 */
function DataTableWrapper({
	children,
	loadingRows = 6,
	isLoading = false,
	emptyState,
	isEmpty = false,
	stickyFirstColumn = false,
	className
}: DataTableWrapperProps) {
	if (isLoading) {
		return (
			<div
				className={cn("overflow-x-auto rounded-lg border border-border", className)}
				aria-busy="true"
				aria-label="Loading table data">
				<table className="w-full text-sm">
					<tbody>
						{Array.from({ length: loadingRows }).map((_, index) => (
							<TableSkeletonRow key={index} />
						))}
					</tbody>
				</table>
			</div>
		);
	}

	if (isEmpty && emptyState) {
		return <div className={cn("rounded-lg border border-border", className)}>{emptyState}</div>;
	}

	return (
		<div
			className={cn(
				"overflow-x-auto rounded-lg border border-border",
				stickyFirstColumn &&
					"[&_td:first-child]:sticky [&_td:first-child]:left-0 [&_td:first-child]:bg-card [&_th:first-child]:sticky [&_th:first-child]:left-0 [&_th:first-child]:bg-muted",
				className
			)}>
			{children}
		</div>
	);
}

export { DataTableWrapper };
export type { DataTableWrapperProps };
