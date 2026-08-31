import { Badge } from "@/components/ui/badge";
import { DashboardHero } from "@/components/ui/dashboard-hero";

import type { InstrumentVersionSummary } from "./authoring/schema";
import { formatCreatedAt } from "./utils";

export function InstrumentsAdminOverview({
	activeVersion,
	versions
}: {
	activeVersion: InstrumentVersionSummary | null;
	versions: InstrumentVersionSummary[];
}) {
	const stats = [
		{
			label: "Saved versions",
			value: versions.length,
			helper: "Every retained version of the YEE instrument."
		},
		{
			label: "Editable drafts",
			value: versions.filter(version => version.lifecycle === "draft").length,
			helper: "Private versions that can still be changed."
		},
		{
			label: "Archived",
			value: versions.filter(version => version.lifecycle === "archived").length,
			helper: "Historical versions protected by audit data."
		},
		{
			label: "Migration drafts",
			value: versions.filter(version => version.compatibility_status === "migration_required").length,
			helper: "Drafts whose structural changes cannot publish yet."
		}
	];

	return (
		<DashboardHero
			size="compact"
			title="YEE instrument"
			subtitle="Author questions the way auditors experience them, then validate and publish a complete version."
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
						Published {formatCreatedAt(activeVersion?.created_at ?? "")} · new audits use this version.
					</p>
				</div>
			}
		/>
	);
}
