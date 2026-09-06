"use client";

import * as React from "react";

import { ScoreBar } from "@/components/ui/score-bar";
import type { PlaceComparisonAuditRecord } from "@/features/workspaces/api/live-api";
import { formatScoreFraction, scorePercent } from "@/lib/score-format";

/**
 * The three score bands, as a legend.
 *
 * Hoisted to module scope so the array and its objects are built once for the
 * lifetime of the module rather than on every render of every chart.
 */
const SCORE_BAND_LEGEND = [
	{ label: "Lower", range: "0–33%", tone: "bg-score-low-fill" },
	{ label: "Middle", range: "34–66%", tone: "bg-score-mid-fill" },
	{ label: "Upper", range: "67–100%", tone: "bg-score-high-fill" }
] as const;

type ChartRow = {
	auditId: string;
	auditorId: string;
	date: string;
	rawPercent: number | null;
	rawFraction: string;
	weightedPercent: number | null;
	weightedFraction: string;
};

function toChartRow(record: PlaceComparisonAuditRecord): ChartRow {
	return {
		auditId: record.audit_id,
		auditorId: record.auditor_id,
		date: record.date,
		rawPercent: scorePercent(record.total_raw_score, record.total_raw_maximum),
		rawFraction: formatScoreFraction(record.total_raw_score, record.total_raw_maximum),
		weightedPercent: scorePercent(record.total_weighted_score, record.total_weighted_maximum),
		weightedFraction: formatScoreFraction(record.total_weighted_score, record.total_weighted_maximum, 2)
	};
}

/**
 * Rank descending by raw score, with unavailable scores last.
 *
 * An unavailable score is not a low score, so it must not sort as one — but it
 * also cannot be ranked, so it collects at the bottom where the empty track
 * reads as "no figure" rather than "worst result".
 */
function byRawScoreDescending(a: ChartRow, b: ChartRow) {
	if (a.rawPercent === null) return b.rawPercent === null ? 0 : 1;
	if (b.rawPercent === null) return -1;
	return b.rawPercent - a.rawPercent;
}

/**
 * Every audit at a place, ranked, on one shared baseline.
 *
 * This replaces a grid of two-hundred-pixel-tall bordered cards, each holding a
 * single vertical pill: twenty-two boxes to carry twenty-two numbers, roughly
 * 2,200px of scrolling, and no common baseline to compare them against. Here
 * each audit is one row, both measures share the row's scale, and the ranking
 * puts the audits that need attention at the top.
 *
 * Both measures are percentages of each audit's own maximum, so they belong on
 * one axis — the raw fraction beside each bar keeps the underlying points
 * visible without a second scale.
 */
function AuditScoreChart({ records }: { records: PlaceComparisonAuditRecord[] }) {
	const rows = React.useMemo(() => [...records].map(toChartRow).sort(byRawScoreDescending), [records]);

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
				{SCORE_BAND_LEGEND.map(band => (
					<span key={band.label} className="flex items-center gap-2 text-xs text-muted-foreground">
						<span aria-hidden className={`h-2.5 w-2.5 rounded-full ${band.tone}`} />
						{band.label}
						<span className="tabular-nums">{band.range}</span>
					</span>
				))}
			</div>
			<ul className="divide-y divide-border/60">
				{rows.map(row => (
					<li key={row.auditId} className="grid gap-2 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
						<div className="min-w-0">
							<p className="truncate text-sm font-semibold text-foreground">{row.auditorId}</p>
							<p className="text-xs text-muted-foreground">{row.date}</p>
						</div>
						<div className="space-y-1.5">
							<ScoreBar percent={row.rawPercent} seriesLabel="Raw" detail={row.rawFraction} />
							<ScoreBar percent={row.weightedPercent} seriesLabel="Youth" detail={row.weightedFraction} />
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}

export { AuditScoreChart };
