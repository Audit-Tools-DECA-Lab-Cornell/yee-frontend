"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type RowAction = {
	label: string;
	href?: string;
	onClick?: () => void;
	icon?: React.ElementType;
	variant?: "default" | "destructive";
};

type DataTableRowActionsProps = {
	/** The primary action, rendered as a visible link/button. */
	primary?: RowAction;
	/** Secondary actions, collapsed into a "⋯" overflow menu. */
	actions?: RowAction[];
	className?: string;
};

/**
 * The single row-action convention for every table: one visible primary
 * action plus an overflow menu for the rest — replacing the previous mix of
 * lone "Open ↗" links, four coloured inline links, and inline buttons.
 */
function DataTableRowActions({ primary, actions = [], className }: DataTableRowActionsProps) {
	const overflow = actions.filter(Boolean);

	return (
		<div className={cn("flex items-center justify-end gap-1", className)}>
			{primary ? (
				primary.href ? (
					<Button asChild variant="quiet" size="sm">
						<Link href={primary.href}>
							{primary.label}
							<ArrowUpRight className="size-4" />
						</Link>
					</Button>
				) : (
					<Button type="button" variant="quiet" size="sm" onClick={primary.onClick}>
						{primary.label}
						<ArrowUpRight className="size-4" />
					</Button>
				)
			) : null}
			{overflow.length > 0 ? (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button type="button" variant="ghost" size="icon-sm" aria-label="More actions">
							<MoreHorizontal className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48">
						{overflow.map(action =>
							action.href ? (
								<DropdownMenuItem key={action.label} variant={action.variant} asChild>
									<Link href={action.href}>
										{action.icon ? <action.icon /> : null}
										{action.label}
									</Link>
								</DropdownMenuItem>
							) : (
								<DropdownMenuItem
									key={action.label}
									variant={action.variant}
									onSelect={() => action.onClick?.()}>
									{action.icon ? <action.icon /> : null}
									{action.label}
								</DropdownMenuItem>
							)
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			) : null}
		</div>
	);
}

export { DataTableRowActions };
export type { RowAction, DataTableRowActionsProps };
