"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, ChevronRight, SlidersHorizontal } from "lucide-react";
import {
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getGroupedRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type ColumnSizingState,
	type ExpandedState,
	type GroupingState,
	type Row,
	type SortingState,
	type Table as TableInstance,
	type VisibilityState
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { DataTableWrapper } from "@/components/ui/data-table-wrapper";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DataTableProps<TData, TValue> = {
	/** Memoize this array - a new reference every render re-creates the table. */
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
	/** Column id(s) to group rows by, with a collapsible header per group. Pass an
	 * array to nest, outermost first (e.g. `["organization", "project_name"]`). */
	groupBy?: string | string[];
	/** Human label for a group header. Pass a record keyed by column id to label
	 * each level of a nested grouping separately. */
	groupLabel?: string | Record<string, string>;
	/** Singular noun for what a group counts, e.g. "audit" -> "4 audits". */
	groupUnit?: string;
	stickyFirstColumn?: boolean;
	/** Optional per-row renderer for the stacked mobile (<md) layout. */
	mobileCard?: (row: TData) => React.ReactNode;
	/** Filter/action bar rendered above the table (left of the Columns menu). */
	toolbar?: React.ReactNode;
	/** Hide the top-right "Columns" visibility menu (shown by default). */
	hideColumnMenu?: boolean;
	className?: string;
};

/** Light column divider - intentionally lighter than the table's row/outline borders. */
const COLUMN_DIVIDER = "border-r border-border/40 last:border-r-0";

/** Only real data columns (with a text header) are resizable/hideable - structural
 * checkbox/action columns keep their natural content width and stay pinned. */
function isDataColumn(columnDef: { header?: unknown }) {
	return typeof columnDef.header === "string";
}

/** Rows, not sub-groups: a nested group header has to count the records a reader
 * can actually open at the bottom of the tree, never the buckets in between. */
function countLeafRows<TData>(row: Row<TData>): number {
	if (!row.subRows.length) return 1;
	return row.subRows.reduce((total, subRow) => total + countLeafRows(subRow), 0);
}

/** Per-level group header label - a string applies to every level, a record
 * labels each grouped column on its own. */
function resolveGroupLabel(groupLabel: string | Record<string, string> | undefined, columnId: string | undefined) {
	if (!groupLabel) return undefined;
	if (typeof groupLabel === "string") return groupLabel;
	return columnId ? groupLabel[columnId] : undefined;
}

function SortIndicator({ direction }: { direction: false | "asc" | "desc" }) {
	if (direction === "asc") return <ArrowUp className="size-3.5" aria-hidden />;
	if (direction === "desc") return <ArrowDown className="size-3.5" aria-hidden />;
	return <ChevronsUpDown className="size-3.5 text-muted-foreground/50" aria-hidden />;
}

type DataTableBodyProps<TData> = {
	table: TableInstance<TData>;
	sized: boolean;
	showBodyDividers: boolean;
	/** Joined grouping key - stable across renders, so the memo below can use it. */
	groupKey: string;
	groupLabel?: string | Record<string, string>;
	/** Serialized `groupLabel`, for the same reason. */
	groupLabelKey: string;
	groupUnit: string;
	columnCount: number;
	hasNoMatches: boolean;
	noResults?: React.ReactNode;
	/** Last visible column flexes to fill remaining width, so it gets no fixed size. */
	lastColumnId?: string;
};

/**
 * Table body extracted so it can be memoized. During an active resize only the
 * table's CSS size variables change; the body markup is identical frame to
 * frame, so skipping its re-render keeps dragging at 60fps.
 */
function DataTableBodyInner<TData>({
	table,
	sized,
	showBodyDividers,
	groupLabel,
	groupUnit,
	columnCount,
	hasNoMatches,
	noResults,
	lastColumnId
}: DataTableBodyProps<TData>) {
	return (
		<TableBody>
			{hasNoMatches ? (
				<TableRow className="hover:bg-transparent">
					<TableCell colSpan={columnCount} className="py-10 text-center text-sm text-muted-foreground">
						{noResults ?? "No results match the selected filters."}
					</TableCell>
				</TableRow>
			) : null}
			{table.getRowModel().rows.map(row => {
				if (row.getIsGrouped()) {
					// Nested levels step in and lighten, so the eye reads org → project
					// as a hierarchy instead of two identical bands stacked together.
					const isTopLevel = row.depth === 0;
					const levelColumnId = row.groupingColumnId ?? "";
					const levelLabel = resolveGroupLabel(groupLabel, levelColumnId);
					const rowCount = countLeafRows(row);
					return (
						<TableRow
							key={row.id}
							className={cn(
								isTopLevel ? "bg-muted/50 hover:bg-muted/60" : "bg-muted/20 hover:bg-muted/30"
							)}>
							<TableCell colSpan={columnCount} className="py-2.5">
								<button
									type="button"
									onClick={row.getToggleExpandedHandler()}
									aria-expanded={row.getIsExpanded()}
									style={{ marginLeft: row.depth * 22 }}
									className={cn(
										"inline-flex items-center gap-2 text-sm text-foreground",
										isTopLevel ? "font-semibold" : "font-medium"
									)}>
									<ChevronRight
										className={cn(
											"size-4 text-muted-foreground transition-transform",
											row.getIsExpanded() && "rotate-90"
										)}
										aria-hidden
									/>
									{levelLabel ? <span className="text-muted-foreground">{levelLabel}:</span> : null}
									{String(row.getGroupingValue(levelColumnId) ?? "—")}
									<span className="font-normal text-muted-foreground tabular-nums">
										· {rowCount} {rowCount === 1 ? groupUnit : `${groupUnit}s`}
									</span>
								</button>
							</TableCell>
						</TableRow>
					);
				}
				return (
					<TableRow key={row.id}>
						{row.getVisibleCells().map(cell => (
							<TableCell
								key={cell.id}
								className={cn(showBodyDividers && COLUMN_DIVIDER, "overflow-hidden")}
								style={
									sized && cell.column.id !== lastColumnId
										? { width: `var(--col-${cell.column.id}-size)` }
										: undefined
								}>
								{flexRender(cell.column.columnDef.cell, cell.getContext())}
							</TableCell>
						))}
					</TableRow>
				);
			})}
		</TableBody>
	);
}

// Memoized variant used only while resizing: the body re-renders only when the
// underlying data (or layout-affecting flags) actually change, never on the
// per-pixel size updates that fire on every pointer move.
const MemoizedDataTableBody = React.memo(
	DataTableBodyInner,
	(prev, next) =>
		prev.table.options.data === next.table.options.data &&
		prev.sized === next.sized &&
		prev.showBodyDividers === next.showBodyDividers &&
		prev.groupKey === next.groupKey &&
		prev.groupLabelKey === next.groupLabelKey &&
		prev.groupUnit === next.groupUnit &&
		prev.columnCount === next.columnCount &&
		prev.lastColumnId === next.lastColumnId &&
		prev.hasNoMatches === next.hasNoMatches &&
		prev.noResults === next.noResults
) as typeof DataTableBodyInner;

/**
 * The shared data table for the whole app. Headless behaviour comes from
 * TanStack Table; the markup and tokens come from our `Table` primitives.
 * Handles sorting, optional collapsible grouping, performant per-column
 * resizing and visibility, loading/empty states, and a stacked-card layout on
 * small screens.
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
	groupUnit = "row",
	stickyFirstColumn = false,
	mobileCard,
	toolbar,
	hideColumnMenu = false,
	className
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [expanded, setExpanded] = React.useState<ExpandedState>(true);
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
	const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
	// Once we have measured the natural (content-fit) widths and locked them in,
	// the table switches to fixed layout + CSS-variable sizing for smooth resizing.
	const [sized, setSized] = React.useState(false);

	const desktopRef = React.useRef<HTMLDivElement>(null);
	const initialSizesRef = React.useRef<ColumnSizingState>({});

	// Joined into a primitive first so an inline `groupBy={["a", "b"]}` from a
	// caller cannot re-create the table (and blow away sizing) on every render.
	const groupKey = React.useMemo(
		() => (Array.isArray(groupBy) ? groupBy.filter(Boolean).join("\u0000") : (groupBy ?? "")),
		[groupBy]
	);
	const groupLabelKey = typeof groupLabel === "string" ? groupLabel : JSON.stringify(groupLabel ?? null);
	const grouping = React.useMemo<GroupingState>(() => (groupKey ? groupKey.split("\u0000") : []), [groupKey]);

	// React Compiler intentionally skips memoizing this component: TanStack Table
	// returns fresh functions each render, and that is the supported usage.
	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data,
		columns,
		state: { sorting, grouping, expanded, columnVisibility, columnSizing },
		onSortingChange: setSorting,
		onExpandedChange: setExpanded,
		onColumnVisibilityChange: setColumnVisibility,
		onColumnSizingChange: setColumnSizing,
		getRowId,
		enableSorting,
		enableColumnResizing: true,
		columnResizeMode: "onChange",
		defaultColumn: { minSize: 60 },
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getGroupedRowModel: getGroupedRowModel(),
		getExpandedRowModel: getExpandedRowModel()
	});

	const rows = table.getRowModel().rows;
	const leafColumns = table.getVisibleLeafColumns();
	const columnCount = leafColumns.length;
	// The rightmost column flexes to fill any leftover width (so narrowing the
	// others never leaves the table looking cut off short of the container).
	const lastColumnId = leafColumns[leafColumns.length - 1]?.id;
	const isEmpty = data.length === 0;
	// Zero rows always says so. Filtering everything out also empties `data`, so
	// keying purely off `!isEmpty` left over-filtered tables rendering a headed
	// but silent body - the reader could not tell a filter from a dead page.
	// The one case that stays quiet is the dedicated empty state below.
	const hasNoMatches = rows.length === 0 && !(isEmpty && emptyState);
	// Group rows are full-width bands; keeping body dividers off when grouped
	// stops any vertical line from cutting through a group header row.
	const showBodyDividers = grouping.length === 0;
	const isResizing = Boolean(table.getState().columnSizingInfo.isResizingColumn);

	// Measure the natural column widths once (from the content-fit auto layout)
	// and seed them as the starting sizes. This is what removes the "snap to a
	// default width then jump back" hiccup: the stored size now matches what the
	// column is actually rendered at, so a drag starts exactly where the cursor is.
	React.useEffect(() => {
		if (sized || isLoading || isEmpty) return;
		const container = desktopRef.current;
		if (!container) return;

		const seed = () => {
			const ths = container.querySelectorAll<HTMLTableCellElement>("thead th");
			const leaf = table.getVisibleLeafColumns();
			if (ths.length === 0 || ths.length !== leaf.length) return false;
			const widths: ColumnSizingState = {};
			let total = 0;
			ths.forEach((th, index) => {
				const width = Math.round(th.getBoundingClientRect().width);
				widths[leaf[index].id] = width;
				total += width;
			});
			if (total <= 0) return false; // hidden (e.g. mobile card view) - wait for visibility.
			initialSizesRef.current = widths;
			setColumnSizing(widths);
			setSized(true);
			return true;
		};

		if (seed()) return;
		// Not measurable yet (container hidden). Re-attempt when it gains a size.
		const observer = new ResizeObserver(() => {
			if (seed()) observer.disconnect();
		});
		observer.observe(container);
		return () => observer.disconnect();
	}, [sized, isLoading, isEmpty, table]);

	// CSS custom properties for every column's width, recomputed only when a size
	// actually changes. Cells read these variables, so a resize updates one style
	// object on the <table> instead of re-rendering every cell.
	const columnSizeVars = React.useMemo(() => {
		const vars: Record<string, string> = {};
		for (const header of table.getFlatHeaders()) {
			vars[`--col-${header.column.id}-size`] = `${header.getSize()}px`;
		}
		return vars;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [table.getState().columnSizingInfo, columnSizing, columnVisibility]);

	// width:100% lets the flexible last column fill the container; minWidth keeps
	// the sum of fixed columns as a floor so wide tables still scroll horizontally.
	const tableStyle = sized
		? ({
				...columnSizeVars,
				width: "100%",
				minWidth: table.getTotalSize(),
				tableLayout: "fixed"
			} as React.CSSProperties)
		: undefined;

	const resetColumnSize = (columnId: string) => {
		const initial = initialSizesRef.current[columnId];
		if (initial != null) {
			setColumnSizing(prev => ({ ...prev, [columnId]: initial }));
		} else {
			table.getColumn(columnId)?.resetSize();
		}
	};

	// Columns that can be toggled from the menu: those that can hide AND expose a
	// plain-text header to label them (structural select/action columns are skipped).
	const hideableColumns = table
		.getAllLeafColumns()
		.filter(column => column.getCanHide() && isDataColumn(column.columnDef));

	const columnMenu =
		hideColumnMenu || hideableColumns.length === 0 ? null : (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button type="button" variant="outline" size="sm">
						<SlidersHorizontal className="size-4" />
						Columns
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-52">
					<DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{hideableColumns.map(column => (
						<DropdownMenuCheckboxItem
							key={column.id}
							className="capitalize"
							checked={column.getIsVisible()}
							// Keep the menu open so several columns can be toggled in one go.
							onSelect={event => event.preventDefault()}
							onCheckedChange={value => column.toggleVisibility(Boolean(value))}>
							{column.columnDef.header as string}
						</DropdownMenuCheckboxItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		);

	// Resizing + visibility only affect the desktop table, so the Columns menu is
	// hidden on mobile whenever a stacked-card layout is in use.
	const topBar =
		toolbar || columnMenu ? (
			<div className="flex flex-wrap items-end justify-around gap-3">
				{toolbar ? <div className="min-w-0 flex-1">{toolbar}</div> : null}
				{columnMenu ? (
					<div className={cn(!toolbar && "ml-auto", mobileCard && "hidden md:block")}>{columnMenu}</div>
				) : null}
			</div>
		) : null;

	// Fully empty dataset → the empty state replaces the table entirely (but the
	// toolbar/column menu still render above the empty slot).
	if (!isLoading && isEmpty && emptyState) {
		return (
			<div className={cn("space-y-4", className)}>
				{topBar}
				{emptyState}
			</div>
		);
	}

	const bodyProps: DataTableBodyProps<TData> = {
		table,
		sized,
		showBodyDividers,
		groupKey,
		groupLabel,
		groupLabelKey,
		groupUnit,
		columnCount,
		hasNoMatches,
		noResults,
		lastColumnId
	};

	return (
		<div className={cn("space-y-4", className)}>
			{topBar}

			{/* Desktop / tablet: real table with horizontal scroll. */}
			<div ref={desktopRef} className={cn(mobileCard && "hidden md:block")}>
				<DataTableWrapper isLoading={isLoading} loadingRows={6} stickyFirstColumn={stickyFirstColumn}>
					<Table style={tableStyle}>
						<TableHeader>
							{table.getHeaderGroups().map(headerGroup => (
								<TableRow key={headerGroup.id} className="hover:bg-transparent">
									{headerGroup.headers.map(header => {
										const isLastColumn = header.column.id === lastColumnId;
										const canSort = header.column.getCanSort();
										// The flexible last column has no fixed width, so no resize handle.
										const canResize =
											header.column.getCanResize() &&
											isDataColumn(header.column.columnDef) &&
											!isLastColumn;
										const headerContent = header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext());
										return (
											<TableHead
												key={header.id}
												className={cn("relative", COLUMN_DIVIDER)}
												style={
													sized && !isLastColumn
														? { width: `var(--col-${header.column.id}-size)` }
														: undefined
												}>
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
												{canResize ? (
													<span
														role="separator"
														aria-orientation="vertical"
														onMouseDown={header.getResizeHandler()}
														onTouchStart={header.getResizeHandler()}
														onDoubleClick={() => resetColumnSize(header.column.id)}
														className={cn(
															"absolute top-0 -right-0.75 z-10 h-full w-1.5 cursor-col-resize touch-none select-none",
															"hover:bg-primary/30",
															header.column.getIsResizing() && "bg-primary/50"
														)}
													/>
												) : null}
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
						{/* Swap in the memoized body while dragging so cells don't re-render each frame. */}
						{isResizing ? <MemoizedDataTableBody {...bodyProps} /> : <DataTableBodyInner {...bodyProps} />}
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
								style={{ paddingLeft: row.depth * 12 }}
								className={cn(
									"px-1 pt-2 text-xs tracking-wide text-muted-foreground uppercase",
									row.depth === 0 ? "font-semibold" : "font-medium"
								)}>
								{String(row.getGroupingValue(row.groupingColumnId ?? "") ?? "—")} · {countLeafRows(row)}{" "}
								{countLeafRows(row) === 1 ? groupUnit : `${groupUnit}s`}
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
