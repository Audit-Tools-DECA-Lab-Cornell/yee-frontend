import { Badge } from "@/components/ui/badge";

import type { InstrumentVersionDetail } from "./schema";
import { SurveyMap } from "./survey-map";

/**
 * How a version's compatibility reads to an admin.
 *
 * Four states, not two. Collapsing them into "Publish compatible" or "Migration
 * required" told admins that every version predating authoring-v2 needed
 * migrating, which is the opposite of true: those versions are the ones in use,
 * and nothing about them is broken. Only `migration_required` is a real warning.
 */
function compatibility(status: InstrumentVersionDetail["compatibility_status"]): {
	label: string;
	variant: "success" | "warning" | "outline" | "destructive";
} {
	switch (status) {
		case "copy_only":
			return { label: "Publish compatible", variant: "success" };
		case "legacy":
			// The original question format. Read by every client, scored by the
			// frozen contract, and in no way pending.
			return { label: "Original format", variant: "outline" };
		case "invalid":
			return { label: "Content invalid", variant: "destructive" };
		default:
			return { label: "Migration required", variant: "warning" };
	}
}

export function LogicalInstrumentViewer({ detail }: { detail: InstrumentVersionDetail }) {
	const questionCount = detail.content.authoring.sections.reduce(
		(total, section) => total + section.questions.length,
		0
	);
	return (
		<div className="space-y-4 border-t border-border bg-muted/20 p-5">
			<div className="flex flex-wrap gap-2">
				<Badge variant="outline">{detail.content.authoring.sections.length} sections</Badge>
				<Badge variant="outline">{questionCount} questions</Badge>
				<Badge variant={compatibility(detail.compatibility_status).variant}>
					{compatibility(detail.compatibility_status).label}
				</Badge>
			</div>
			<SurveyMap authoring={detail.content.authoring} />
		</div>
	);
}
