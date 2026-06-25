import * as React from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SaveStatusState = "idle" | "saving" | "saved" | "error";

type AuditSaveStatusProps = {
	status: SaveStatusState;
	className?: string;
};

/**
 * Compact save status indicator for the audit wizard header.
 * Uses aria-live so screen readers announce state changes.
 */
function AuditSaveStatus({ status, className }: AuditSaveStatusProps) {
	const content: Record<SaveStatusState, { icon: React.ReactNode; text: string; color: string }> = {
		idle: {
			icon: null,
			text: "",
			color: ""
		},
		saving: {
			icon: <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />,
			text: "Saving...",
			color: "text-muted-foreground"
		},
		saved: {
			icon: <CheckCircle2 className="size-3.5" aria-hidden="true" />,
			text: "Saved",
			color: "text-[var(--yee-green-700)]"
		},
		error: {
			icon: <AlertCircle className="size-3.5" aria-hidden="true" />,
			text: "Save failed",
			color: "text-destructive"
		}
	};

	const { icon, text, color } = content[status];

	if (status === "idle") return null;

	return (
		<span
			className={cn("inline-flex items-center gap-1.5 text-xs font-medium", color, className)}
			aria-live="polite"
			role="status">
			{icon}
			{text}
		</span>
	);
}

export { AuditSaveStatus };
export type { SaveStatusState };
