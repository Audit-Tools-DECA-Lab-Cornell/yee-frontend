"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TagListCellProps = {
	items: string[];
	/** Plural noun for the count line — `auditors` renders `30 auditors`. */
	unit: string;
	/** Shown instead of the count when `items` is empty. */
	emptyLabel: string;
	/** Chips kept visible before the overflow toggle. */
	visibleCount?: number;
	className?: string;
};

/**
 * A capped list of identifier chips for a table cell.
 *
 * The uncapped version of this rendered one chip per item with no limit, so a
 * place with thirty assigned auditors produced fifteen wrapped rows of chips
 * and a table row roughly eight times the height of its neighbours — the rest
 * of that row became dead space. Worse, a wall of generated IDs is not a
 * signal a manager can act on.
 *
 * So the count leads: it is the number that answers "is this place covered?".
 * The identifiers stay one click away for the cases where a specific ID
 * matters, and a collapsed cell always occupies the same fixed height.
 */
function TagListCell({ items, unit, emptyLabel, visibleCount = 3, className }: TagListCellProps) {
	const [expanded, setExpanded] = React.useState(false);

	if (items.length === 0) {
		return <span className={cn("text-muted-foreground", className)}>{emptyLabel}</span>;
	}

	const overflowCount = items.length - visibleCount;
	const shown = expanded ? items : items.slice(0, visibleCount);

	return (
		<div className={cn("space-y-1.5", className)}>
			<p className="text-sm text-muted-foreground">
				<span className="font-medium tabular-nums text-foreground">{items.length}</span> {unit}
			</p>
			<div className="flex flex-wrap items-center gap-1.5">
				{shown.map(item => (
					<Badge key={item} variant="secondary" className="font-normal">
						{item}
					</Badge>
				))}
				{overflowCount > 0 ? (
					<button
						type="button"
						aria-expanded={expanded}
						onClick={() => setExpanded(value => !value)}
						className="rounded-control px-1.5 py-0.5 text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
						{expanded ? "Show less" : `+${overflowCount} more`}
					</button>
				) : null}
			</div>
		</div>
	);
}

export { TagListCell };
export type { TagListCellProps };
