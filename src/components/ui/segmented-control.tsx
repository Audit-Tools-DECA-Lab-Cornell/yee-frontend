"use client";

import * as React from "react";
import { ToggleGroup } from "radix-ui";

import { cn } from "@/lib/utils";

type SegmentedOption = {
	label: React.ReactNode;
	value: string;
	disabled?: boolean;
};

type SegmentedControlProps = {
	value: string;
	onValueChange: (value: string) => void;
	options: SegmentedOption[];
	size?: "sm" | "default";
	"aria-label"?: string;
	className?: string;
};

/**
 * A single-select segmented toggle — the professional replacement for the
 * ad-hoc `rounded-md` toggle buttons that used to litter the reports view.
 * Always keeps exactly one option selected (deselect is prevented).
 */
function SegmentedControl({
	value,
	onValueChange,
	options,
	size = "default",
	className,
	...props
}: SegmentedControlProps) {
	return (
		<ToggleGroup.Root
			type="single"
			value={value}
			onValueChange={next => {
				// Guard against radix's deselect-to-empty behaviour: a segmented
				// control always has one active segment.
				if (next) onValueChange(next);
			}}
			aria-label={props["aria-label"]}
			className={cn(
				"inline-flex items-center gap-0.5 rounded-control border border-border bg-muted p-0.5",
				className
			)}>
			{options.map(option => (
				<ToggleGroup.Item
					key={option.value}
					value={option.value}
					disabled={option.disabled}
					className={cn(
						"inline-flex items-center justify-center gap-1.5 rounded-[3px] font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none",
						"hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
						"data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm",
						"disabled:pointer-events-none disabled:opacity-50",
						size === "sm" ? "h-6 px-2 text-xs" : "h-7 px-2.5 text-sm",
						"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
					)}>
					{option.label}
				</ToggleGroup.Item>
			))}
		</ToggleGroup.Root>
	);
}

export { SegmentedControl };
export type { SegmentedControlProps, SegmentedOption };
