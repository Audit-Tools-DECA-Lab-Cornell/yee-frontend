import type { VariantProps } from "class-variance-authority";

import type { badgeVariants } from "@/components/ui/badge";

/**
 * Single source of truth for place audit-readiness status. Both the admin
 * and manager tables must map identical inputs to identical labels —
 * previously the admin table showed "Up to date" for a never-audited place
 * while the manager table correctly showed "Pending first audit".
 */

export type StatusTone = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export type StatusDescriptor = {
	label: string;
	tone: StatusTone;
};

/**
 * Derive a place's readiness status from its audit count and any raw status
 * string from the backend. Zero audits always resolves to "Pending first
 * audit", regardless of a stale backend status.
 */
export function getPlaceStatus({
	auditCount,
	rawStatus
}: {
	auditCount: number;
	rawStatus?: string | null;
}): StatusDescriptor {
	if (!auditCount || auditCount <= 0) {
		return { label: "Pending first audit", tone: "warning" };
	}

	switch (rawStatus?.trim().toLowerCase()) {
		case "up to date":
		case "current":
		case "complete":
		case "completed":
			return { label: "Up to date", tone: "success" };
		case "overdue":
		case "expired":
			return { label: "Overdue", tone: "destructive" };
		case "in progress":
		case "in-progress":
			return { label: "In progress", tone: "secondary" };
		default:
			return { label: rawStatus?.trim() || "Audited", tone: "success" };
	}
}
