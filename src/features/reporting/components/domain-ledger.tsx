"use client";

import * as React from "react";

import { DomainLabel } from "@/components/ui/domain-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ScoreMicro } from "@/components/ui/score-micro";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DomainLedgerTable } from "@/features/reporting/components/domain-ledger-table";
import {
	buildDomainLedgerModel,
	type DomainLedgerAverage,
	type DomainLedgerAverageScore,
	type DomainLedgerDomain,
	type DomainLedgerMetric,
	type DomainLedgerRow,
	type DomainLedgerScore
} from "@/features/reporting/domain-ledger-model";
import { domainLabels, domainOrder } from "@/features/reporting/reporting";
import type { PlaceComparisonAuditRecord } from "@/features/workspaces/api/live-api";
import { SCORE_UNAVAILABLE } from "@/lib/score-format";

const METRIC_OPTIONS = [
	{ label: "Raw", value: "raw" },
	{ label: "Youth", value: "weighted" }
];

type DomainLedgerProps = {
	readonly records: readonly PlaceComparisonAuditRecord[];
	readonly className?: string;
};

function isLedgerMetric(value: string): value is DomainLedgerMetric {
	return value === "raw" || value === "weighted";
}

function auditLabel(row: DomainLedgerRow): string {
	return row.participantId ? `${row.auditorId} · ${row.participantId}` : row.auditorId;
}

function scoreForDomain(row: DomainLedgerRow, domain: DomainLedgerDomain): DomainLedgerScore {
	return row.domains.find(cell => cell.domain === domain) ?? { percent: null, fraction: SCORE_UNAVAILABLE };
}

function averageForDomain(average: DomainLedgerAverage, domain?: DomainLedgerDomain): DomainLedgerAverageScore {
	return domain ? (average.domains.find(cell => cell.domain === domain) ?? average.overall) : average.overall;
}

function MobileGroup({
	label,
	domain,
	rows,
	average,
	metric
}: {
	readonly label: string;
	readonly domain?: DomainLedgerDomain;
	readonly rows: readonly DomainLedgerRow[];
	readonly average: DomainLedgerAverage;
	readonly metric: DomainLedgerMetric;
}) {
	const metricLabel = metric === "raw" ? "Raw" : "Youth-weighted";
	const averageScore = averageForDomain(average, domain);
	return (
		<section aria-label={`${label} scores`}>
			<h3 className="sticky top-0 border-b border-border bg-card px-4 py-2 text-sm font-medium text-foreground">
				{domain ? <DomainLabel domain={domain} label={label} className="text-sm" /> : label}
			</h3>
			<ul className="divide-y divide-border/70">
				{rows.map(row => {
					const score = domain ? scoreForDomain(row, domain) : row.overall;
					return (
						<li
							key={`${domain ?? "overall"}-${row.auditId}`}
							className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3">
							<span className="min-w-0">
								<span className="block truncate text-sm font-medium text-foreground">
									{auditLabel(row)}
								</span>
								<span className="block text-xs text-muted-foreground">{row.date}</span>
							</span>
							<ScoreMicro
								percent={score.percent}
								fraction={score.fraction}
								label={`${metricLabel} ${label} score for ${auditLabel(row)}`}
								align="end"
							/>
						</li>
					);
				})}
				<li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 bg-muted/40 px-4 py-3">
					<span className="min-w-0">
						<span className="block text-sm font-semibold text-foreground">Average</span>
						<span className="block text-xs text-muted-foreground">{rows.length} selected reports</span>
					</span>
					<ScoreMicro
						percent={averageScore.percent}
						fraction={averageScore.fraction}
						detail={averageScore.detail}
						label={`${metricLabel} ${label} average across selected reports`}
						align="end"
					/>
				</li>
			</ul>
		</section>
	);
}

function DomainLedger({ records, className }: DomainLedgerProps) {
	const [metric, setMetric] = React.useState<DomainLedgerMetric>("raw");
	const model = React.useMemo(() => buildDomainLedgerModel(records, metric), [metric, records]);
	const average = model.average;

	return (
		<section aria-label="Domain ledger" className={className}>
			<div className="mb-4 flex flex-wrap items-end justify-between gap-3">
				<div className="flex min-w-0 flex-col gap-1">
					<h2 className="text-base font-semibold text-foreground">Domain ledger</h2>
					<p className="text-sm text-muted-foreground">
						Each percentage uses that audit&rsquo;s own available maximum.
					</p>
				</div>
				<SegmentedControl
					value={metric}
					onValueChange={value => {
						if (isLedgerMetric(value)) setMetric(value);
					}}
					options={METRIC_OPTIONS}
					size="sm"
					aria-label="Domain ledger score type"
				/>
			</div>
			{model.rows.length === 0 || average === null ? (
				<EmptyState title="No reports selected" description="Select reports to compare their domain scores." />
			) : (
				<>
					<DomainLedgerTable rows={model.rows} average={average} metric={metric} />
					<div
						role="region"
						aria-label="Domain comparison. Scroll to review every domain and selected report."
						tabIndex={0}
						className="max-h-[36rem] overflow-y-auto rounded-md border border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none 2xl:hidden">
						<MobileGroup label="Overall" rows={model.rows} average={average} metric={metric} />
						{domainOrder.map(domain => (
							<MobileGroup
								key={domain}
								label={domainLabels[domain]}
								domain={domain}
								rows={model.rows}
								average={average}
								metric={metric}
							/>
						))}
					</div>
				</>
			)}
		</section>
	);
}

export { DomainLedger };
export type { DomainLedgerProps };
