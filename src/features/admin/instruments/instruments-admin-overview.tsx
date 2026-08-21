import { Badge } from "@/components/ui/badge";
import { DashboardHero } from "@/components/ui/dashboard-hero";

import type { InstrumentSummary, InstrumentVersionRecord } from "./types";
import { formatCreatedAt } from "./utils";

export function InstrumentsAdminOverview({
	activeVersion,
	summary
}: {
	activeVersion: InstrumentVersionRecord | null;
	summary: InstrumentSummary;
}) {
	const stats = [
		{
			label: "Sections",
			value: summary.sections,
			helper: "The number of sections in the instrument."
		},
		{
			label: "Questions",
			value: summary.items,
			helper: "The number of questions in the instrument."
		},
		{
			label: "Pre-Audit",
			value: summary.preAuditQuestions,
			helper: "The number of pre-audit questions in the instrument."
		},
		{
			label: "Legal Documents",
			value: summary.legalDocuments,
			helper: "The number of legal documents in the instrument."
		}
	];

	return (
		<DashboardHero
			size="compact"
			title="Instrument management"
			subtitle="Manage the YEE audit instrument — edit drafts, publish a version, and review version history."
			stats={activeVersion ? stats : undefined}
			statsLabel={
				<div className="space-y-1 text-shadow pb-4 pt-3">
					<p className="text-xs font-semibold uppercase tracking-[0.15em]">Currently live</p>
					<div className="flex flex-wrap items-start gap-2">
						<p className="text-3xl font-semibold text-shadow-foreground">
							{activeVersion?.instrument_version}
						</p>
						<Badge className="w-10 h-3 text-[9px] leading-4" variant="success">
							Active
						</Badge>
					</div>
					<p className="text-sm text-shadow-secondary">
						Published {formatCreatedAt(activeVersion?.created_at ?? "")} - this is the version the public
						site uses right now.
					</p>
				</div>
			}
		/>
	);
}
