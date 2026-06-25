"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type AuditOptionButtonProps = {
	/** The visible label for this option. */
	label: string;
	/** Whether this option is currently selected. */
	selected: boolean;
	/** Domain-specific CSS classes for the selected state border color. */
	selectedBorderClass?: string;
	/** Domain-specific CSS classes for the selected state background. */
	selectedBgClass?: string;
	/** Domain-specific CSS classes for the idle state. */
	idleClass?: string;
	/** Underlying input props (id, name, value, etc.) */
	inputProps: React.InputHTMLAttributes<HTMLInputElement>;
	/** Whether this is a checkbox (multi-select) or radio (single-select). */
	type: "radio" | "checkbox";
	children?: React.ReactNode;
};

/**
 * Card-style option button that wraps a native radio or checkbox input.
 * The card is the visual; the input provides accessibility semantics.
 *
 * Domain color is expressed as a border accent on the selected state,
 * not as a background fill.
 */
function AuditOptionButton({
	label,
	selected,
	selectedBorderClass = "border-[var(--yee-green-600)]",
	selectedBgClass = "bg-[var(--yee-green-50)]",
	idleClass = "border-border bg-background hover:bg-muted",
	inputProps,
	type,
	children
}: AuditOptionButtonProps) {
	return (
		<label className="block cursor-pointer">
			<input type={type} className="sr-only" {...inputProps} />
			<span
				aria-pressed={selected}
				className={cn(
					"flex items-start gap-3 rounded-lg border p-3.5 text-sm font-medium text-foreground transition-colors",
					selected ? cn("border-2", selectedBorderClass, selectedBgClass) : cn("border", idleClass)
				)}>
				{/* Custom visual indicator */}
				<span
					className={cn(
						"mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
						selected ? cn(selectedBorderClass, "bg-current") : "border-muted-foreground/40"
					)}
					aria-hidden="true">
					{selected ? <span className="size-1.5 rounded-full bg-background" aria-hidden="true" /> : null}
				</span>

				<span className="flex-1">
					{label}
					{children}
				</span>
			</span>
		</label>
	);
}

export { AuditOptionButton };
