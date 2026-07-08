"use client";

import * as React from "react";
import { ChevronDown, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type ExportMenuOption<TFormat extends string> = {
	format: TFormat;
	label: string;
	description?: string;
};

/**
 * Reusable "Export ▾" menu. The heavy export modules are loaded via dynamic
 * `import()` inside `onExport`, so nothing enters the initial bundle until a
 * user actually exports. Shows a pending state on the button while generating
 * and surfaces failures as a toast (the export happens client-side, so errors
 * are otherwise invisible).
 */
export function ExportMenuButton<TFormat extends string>({
	label = "Export",
	options,
	onExport,
	disabled = false,
	disabledReason,
	variant = "outline",
	size = "default",
	align = "end",
	className
}: {
	label?: string;
	options: ExportMenuOption<TFormat>[];
	onExport: (format: TFormat) => Promise<void>;
	disabled?: boolean;
	disabledReason?: string;
	variant?: React.ComponentProps<typeof Button>["variant"];
	size?: React.ComponentProps<typeof Button>["size"];
	align?: "start" | "center" | "end";
	className?: string;
}) {
	const [pending, setPending] = React.useState<TFormat | null>(null);

	async function runExport(format: TFormat) {
		setPending(format);
		try {
			await onExport(format);
		} catch (error) {
			toast.error("Export failed", {
				description: error instanceof Error ? error.message : "Something went wrong while generating the file."
			});
		} finally {
			setPending(null);
		}
	}

	const trigger = (
		<Button
			type="button"
			variant={variant}
			size={size}
			className={className}
			isLoading={pending !== null}
			disabled={disabled || pending !== null}>
			<Download className="size-4" aria-hidden />
			{label}
			<ChevronDown className="size-4 opacity-70" aria-hidden />
		</Button>
	);

	// When disabled, never render the interactive menu. A disabled trigger can't
	// receive hover events, so wrap it: a tooltip when we can explain why,
	// otherwise a plain aria-disabled wrapper (never a silently-inert dropdown).
	if (disabled) {
		return disabledReason ? (
			<Tooltip>
				<TooltipTrigger asChild>
					<span className="inline-flex" tabIndex={0} aria-label={disabledReason}>
						{trigger}
					</span>
				</TooltipTrigger>
				<TooltipContent>{disabledReason}</TooltipContent>
			</Tooltip>
		) : (
			<span className="inline-flex" aria-disabled="true">
				{trigger}
			</span>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
			<DropdownMenuContent align={align} className="min-w-44">
				{options.map(option => (
					<DropdownMenuItem
						key={option.format}
						disabled={pending !== null}
						onSelect={event => {
							// Keep the click from bubbling to row/link handlers.
							event.preventDefault();
							void runExport(option.format);
						}}
						className="flex items-center justify-between gap-6">
						<span className="flex flex-col">
							<span className="font-medium">{option.label}</span>
							{option.description ? (
								<span className="text-xs text-muted-foreground">{option.description}</span>
							) : null}
						</span>
						{pending === option.format ? <Spinner size="xs" /> : null}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
