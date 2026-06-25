import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldProps = {
	/** The visible label text. */
	label: string;
	/** The `id` of the associated input element. */
	htmlFor: string;
	/** Optional helper text shown below the label. */
	description?: string;
	/** Inline validation error message. Triggers `aria-live` announcement. */
	error?: string;
	/** Appends an asterisk to the label and marks the field required semantically. */
	required?: boolean;
	className?: string;
	children: React.ReactNode;
};

/**
 * Composed form field wrapper providing accessible label, description,
 * and inline error with `aria-live` announcement.
 */
function Field({ label, htmlFor, description, error, required = false, className, children }: FieldProps) {
	const descriptionId = description ? `${htmlFor}-description` : undefined;
	const errorId = error ? `${htmlFor}-error` : undefined;

	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<Label htmlFor={htmlFor}>
				{label}
				{required ? (
					<span className="ml-0.5 text-destructive" aria-hidden="true">
						*
					</span>
				) : null}
			</Label>

			{description ? (
				<p id={descriptionId} className="text-xs text-muted-foreground leading-relaxed">
					{description}
				</p>
			) : null}

			{/* Slot the input/textarea/select here. Consumers should wire
          aria-describedby to descriptionId and errorId themselves via
          the passed `htmlFor` pattern, or use the FieldInput helper. */}
			<div
				data-has-error={Boolean(error)}
				className="[&_input]:data-[has-error=true]:border-destructive [&_textarea]:data-[has-error=true]:border-destructive [&_select]:data-[has-error=true]:border-destructive">
				{React.Children.map(children, child => {
					if (!React.isValidElement(child)) return child;

					const extraProps: Record<string, string | undefined> = {};
					const describedByParts: string[] = [];
					if (descriptionId) describedByParts.push(descriptionId);
					if (errorId) describedByParts.push(errorId);
					if (describedByParts.length > 0) {
						extraProps["aria-describedby"] = describedByParts.join(" ");
					}
					if (error) {
						extraProps["aria-invalid"] = "true";
					}

					return React.cloneElement(child, extraProps as Record<string, unknown>);
				})}
			</div>

			{error ? (
				<p id={errorId} role="alert" aria-live="polite" className="text-xs font-medium text-destructive">
					{error}
				</p>
			) : null}
		</div>
	);
}

export { Field };
export type { FieldProps };
