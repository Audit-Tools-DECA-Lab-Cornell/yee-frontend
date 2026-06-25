import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
	title: string;
	description?: string;
	/** Optional badge/label shown above the title. */
	badge?: string;
	/** Action buttons or controls rendered to the right of the heading. */
	actions?: React.ReactNode;
	className?: string;
};

/**
 * Shared page heading component. Renders title, optional description,
 * optional badge label, and optional action slot.
 */
function PageHeader({ title, description, badge, actions, className }: PageHeaderProps) {
	return (
		<div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
			<div className="min-w-0 flex-1 space-y-1">
				{badge ? (
					<Badge variant="secondary" className="mb-2">
						{badge}
					</Badge>
				) : null}
				<h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
				{description ? (
					<p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{description}</p>
				) : null}
			</div>

			{actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
		</div>
	);
}

export { PageHeader };
export type { PageHeaderProps };
