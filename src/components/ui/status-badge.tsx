import { Badge } from "@/components/ui/badge";
import type { StatusDescriptor, StatusTone } from "@/lib/status";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
	label: string;
	tone?: StatusTone;
	dot?: boolean;
	className?: string;
};

/** Consistent, dot-prefixed status badge — the only status pill in the app. */
function StatusBadge({ label, tone = "secondary", dot = true, className }: StatusBadgeProps) {
	return (
		<Badge variant={tone} dot={dot} className={cn("font-medium", className)}>
			{label}
		</Badge>
	);
}

/** Renders a resolved status descriptor (e.g. from `getPlaceStatus`). */
function StatusBadgeFor({ status, className }: { status: StatusDescriptor; className?: string }) {
	return <StatusBadge label={status.label} tone={status.tone} className={className} />;
}

export { StatusBadge, StatusBadgeFor };
export type { StatusBadgeProps };
