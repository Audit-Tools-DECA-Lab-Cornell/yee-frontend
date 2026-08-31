import { Badge } from "@/components/ui/badge";

import type { InstrumentVersionDetail } from "./schema";
import { SurveyMap } from "./survey-map";

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
				<Badge variant={detail.compatibility_status === "copy_only" ? "success" : "warning"}>
					{detail.compatibility_status === "copy_only" ? "Publish compatible" : "Migration required"}
				</Badge>
			</div>
			<SurveyMap authoring={detail.content.authoring} />
		</div>
	);
}
