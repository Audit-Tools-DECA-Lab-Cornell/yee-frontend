"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, ChevronRight } from "lucide-react";
import {
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getGroupedRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type ExpandedState,
	type GroupingState,
	type SortingState
} from "@tanstack/react-table";

import { DataTableWrapper } from "@/components/ui/data-table-wrapper";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DataTableProps<TData, TValue> = {
	/** Memoize this array — a new reference every render re-creates the table. */
	columns: ColumnDef<TData, TValue>[];
	/** Memoize this array for the same reason. */
	data: TData[];
	isLoading?: boolean;
	/** Rendered when there are zero rows (pass an `<EmptyState />`). */
	emptyState?: React.ReactNode;
	/** Rendered when a filtered dataset has no matches (falls back to `emptyState`). */
	noResults?: React.ReactNode;
	getRowId?: (row: TData, index: number) => string;
	enableSorting?: boolean;
	/** Column id to group rows by, with a collapsible header per group. */
	groupBy?: string;
	/** Human label for a group header, e.g. "project". */
	groupLabel?: string;
	stickyFirstColumn?: boolean;
	/** Optional per-row renderer for the stacked mobile (<md) layout. */
	mobileCard?: (row: TData) => React.ReactNode;
	/** Filter/action bar rendered above the table. */
	toolbar?: React.ReactNode;
	className?: string;
};

function SortIndicator({ direction }: { direction: false | "asc" | "desc" }) {
	if (direction === "asc") return <ArrowUp className="size-3.5" aria-hidden />;
	if (direction === "desc") return <ArrowDown className="size-3.5" aria-hidden />;
	return <ChevronsUpDown className="size-3.5 text-muted-foreground/50" aria-hidden />;
}

/**
 * The shared data table for the whole app. Headless behaviour comes from
 * TanStack Table; the markup and tokens come from our `Table` primitives.
 * Handles sorting, optional collapsible grouping, loading/empty states, and a
 * stacked-card layout on small screens.
 */
function DataTable<TData, TValue>({
	columns,
	data,
	isLoading = false,
	emptyState,
	noResults,
	getRowId,
	enableSorting = true,
	groupBy,
	groupLabel,
	stickyFirstColumn = false,
	mobileCard,
	toolbar,
	className
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [expanded, setExpanded] = React.useState<ExpandedState>(true);

	const grouping = React.useMemo<GroupingState>(() => (groupBy ? [groupBy] : []), [groupBy]);

	// React Compiler intentionally skips memoizing this component: TanStack Table
	// returns fresh functions each render, and that is the supported usage.
	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data,
		columns,
		state: { sorting, grouping, expanded },
		onSortingChange: setSorting,
		onExpandedChange: setExpanded,
		getRowId,
		enableSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getGroupedRowModel: getGroupedRowModel(),
		getExpandedRowModel: getExpandedRowModel()
	});

	const rows = table.getRowModel().rows;
	const columnCount = table.getVisibleLeafColumns().length;
	const isEmpty = data.length === 0;
	const hasNoMatches = !isEmpty && rows.length === 0;

	// Fully empty dataset → the empty state replaces the table entirely.
	if (!isLoading && isEmpty && emptyState) {
		return <div className={cn("space-y-4", className)}>{emptyState}</div>;
	}

	return (
		<div className={cn("space-y-4", className)}>
			{toolbar ? <div>{toolbar}</div> : null}

			{/* Desktop / tablet: real table with horizontal scroll. */}
			<div className={cn(mobileCard && "hidden md:block")}>
				<DataTableWrapper isLoading={isLoading} loadingRows={6} stickyFirstColumn={stickyFirstColumn}>
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map(headerGroup => (
								<TableRow key={headerGroup.id} className="hover:bg-transparent">
									{headerGroup.headers.map(header => {
										const canSort = header.column.getCanSort();
										const headerContent = header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext());
										return (
											<TableHead key={header.id}>
												{canSort ? (
													<button
														type="button"
														onClick={header.column.getToggleSortingHandler()}
														className="inline-flex items-center gap-1.5 hover:text-foreground">
														{headerContent}
														<SortIndicator direction={header.column.getIsSorted()} />
													</button>
												) : (
													headerContent
												)}
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{hasNoMatches ? (
								<TableRow className="hover:bg-transparent">
									<TableCell
										colSpan={columnCount}
										className="py-10 text-center text-sm text-muted-foreground">
										{noResults ?? "No results match the selected filters."}
									</TableCell>
								</TableRow>
							) : null}
							{rows.map(row => {
								if (row.getIsGrouped()) {
									return (
										<TableRow key={row.id} className="bg-muted/40 hover:bg-muted/50">
											<TableCell colSpan={columnCount} className="py-2.5">
												<button
													type="button"
													onClick={row.getToggleExpandedHandler()}
													className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
													<ChevronRight
														className={cn(
															"size-4 text-muted-foreground transition-transform",
															row.getIsExpanded() && "rotate-90"
														)}
														aria-hidden
													/>
													{groupLabel ? (
														<span className="text-muted-foreground">{groupLabel}:</span>
													) : null}
													{String(row.getGroupingValue(groupBy as string) ?? "—")}
													<span className="font-normal text-muted-foreground">
														({row.subRows.length})
													</span>
												</button>
											</TableCell>
										</TableRow>
									);
								}
								return (
									<TableRow key={row.id}>
										{row.getVisibleCells().map(cell => (
											<TableCell key={cell.id}>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</TableCell>
										))}
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</DataTableWrapper>
			</div>

			{/* Mobile: stacked cards. */}
			{mobileCard ? (
				<div className="space-y-3 md:hidden">
					{hasNoMatches ? (
						<p className="py-6 text-center text-sm text-muted-foreground">
							{noResults ?? "No results match the selected filters."}
						</p>
					) : null}
					{rows.map(row =>
						row.getIsGrouped() ? (
							<p
								key={row.id}
								className="px-1 pt-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
								{String(row.getGroupingValue(groupBy as string) ?? "—")} ({row.subRows.length})
							</p>
						) : (
							<div key={row.id}>{mobileCard(row.original)}</div>
						)
					)}
				</div>
			) : null}
		</div>
	);
}

export { DataTable };
export type { DataTableProps };
