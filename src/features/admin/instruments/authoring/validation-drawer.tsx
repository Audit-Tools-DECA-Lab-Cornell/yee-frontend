import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { InstrumentDraftValidation } from "@/features/workspaces/api/live-api";

import type { AuthoringFinding } from "./validation";

export function ValidationDrawer({
	localFindings,
	serverValidation
}: {
	localFindings: AuthoringFinding[];
	serverValidation: InstrumentDraftValidation | null;
}) {
	const serverReasons = serverValidation?.reasons ?? [];
	const ready = localFindings.length === 0 && serverValidation?.activation_ready === true;
	return (
		<aside className="space-y-4 rounded-md border border-border bg-card p-4 xl:sticky xl:top-24">
			<div className="flex items-center justify-between gap-3">
				<h2 className="text-sm font-semibold text-foreground">Validation</h2>
				<Badge
					variant={ready ? "success" : localFindings.length || serverReasons.length ? "warning" : "outline"}>
					{ready ? "Ready" : "Review"}
				</Badge>
			</div>
			{localFindings.length === 0 && !serverValidation ? (
				<p className="text-sm text-muted-foreground">Save and validate to check publish compatibility.</p>
			) : null}
			{ready ? (
				<div className="flex gap-2 text-sm text-success">
					<CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
					<span>This draft can be published without changing scoring structure.</span>
				</div>
			) : null}
			<div className="space-y-3">
				{localFindings.map((finding, index) => (
					<div key={`${finding.code}-${finding.questionId ?? index}`} className="flex gap-2 text-sm">
						<AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
						<div>
							<p className="font-medium text-foreground">{finding.message}</p>
							{finding.questionId ? (
								<code className="text-xs text-muted-foreground">{finding.questionId}</code>
							) : null}
						</div>
					</div>
				))}
				{serverReasons.map((reason, index) => (
					<div key={`${reason.code}-${reason.question_id ?? index}`} className="flex gap-2 text-sm">
						<AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
						<div>
							<p className="font-medium text-foreground">{reason.message}</p>
							<code className="text-xs text-muted-foreground">
								{reason.question_id ?? reason.item_id ?? reason.code}
							</code>
						</div>
					</div>
				))}
			</div>
		</aside>
	);
}
