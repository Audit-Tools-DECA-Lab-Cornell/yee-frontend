/**
 * Shared comparison math for the dashboard and the R2/R3/R4 exports. The on-
 * screen dashboard imports the percentage helpers so the exported figures are
 * computed by the same functions the user saw (plan acceptance criterion 3).
 * The delta helpers are the "intervention story" content that debuts in exports
 * (logistics §6).
 */
import type { PlaceComparisonAuditRecord } from "@/features/workspaces/api/live-api";
import { aggregateScoreEntries, scorePercentage } from "@/lib/score-format";

import { domainLabels, domainOrder, type PlaceComparisonSummary, type YeeDomainKey } from "./types";

export function clampPercentage(value: number): number {
	return Math.max(0, Math.min(100, value));
}

export function percentage(numerator: number, denominator: number): number | null {
	return scorePercentage(numerator, denominator);
}

export function auditRawPercent(record: PlaceComparisonAuditRecord): number | null {
	return percentage(record.total_raw_score, record.total_raw_maximum);
}

export function auditWeightedPercent(record: PlaceComparisonAuditRecord): number | null {
	return percentage(record.total_weighted_score, record.total_weighted_maximum);
}

/** Per-domain raw percentages for one audit, in domain order. */
export function auditDomainRawPercents(record: PlaceComparisonAuditRecord): Record<YeeDomainKey, number | null> {
	return Object.fromEntries(
		domainOrder.map(domain => [
			domain,
			percentage(record.raw_domain_scores[domain], record.raw_domain_maximums[domain])
		])
	) as Record<YeeDomainKey, number | null>;
}

function rounded(value: number | null, fractionDigits: number): number | null {
	return value === null ? null : Number(value.toFixed(fractionDigits));
}

/**
 * Roll up filtered audits into per-place summaries (mirrors the dashboard's
 * `buildPlaceSummaries`): averaged totals + averaged per-domain percentages,
 * sorted by youth-weighted average descending.
 */
export function buildPlaceComparisonSummaries(records: PlaceComparisonAuditRecord[]): PlaceComparisonSummary[] {
	const grouped = new Map<string, PlaceComparisonAuditRecord[]>();
	for (const record of records) {
		const next = grouped.get(record.place_id) ?? [];
		next.push(record);
		grouped.set(record.place_id, next);
	}

	return Array.from(grouped.values())
		.map(placeRecords => {
			const [first] = placeRecords;
			const rawTotal = aggregateScoreEntries(
				placeRecords.map(record => ({ value: record.total_raw_score, maximum: record.total_raw_maximum }))
			);
			const weightedTotal = aggregateScoreEntries(
				placeRecords.map(record => ({
					value: record.total_weighted_score,
					maximum: record.total_weighted_maximum
				}))
			);
			const rawPercentByDomain = Object.fromEntries(
				domainOrder.map(domain => {
					const aggregate = aggregateScoreEntries(
						placeRecords.map(record => ({
							value: record.raw_domain_scores[domain],
							maximum: record.raw_domain_maximums[domain]
						}))
					);
					return [domain, rounded(aggregate.meanPercentage, 1)];
				})
			) as Record<YeeDomainKey, number | null>;
			const weightedPercentByDomain = Object.fromEntries(
				domainOrder.map(domain => {
					const aggregate = aggregateScoreEntries(
						placeRecords.map(record => ({
							value: record.weighted_domain_scores[domain],
							maximum: record.weighted_domain_maximums[domain]
						}))
					);
					return [domain, rounded(aggregate.meanPercentage, 1)];
				})
			) as Record<YeeDomainKey, number | null>;
			return {
				placeId: first.place_id,
				placeName: first.place_name,
				projectName: first.project_name,
				auditCount: placeRecords.length,
				avgRawScore: rounded(rawTotal.meanValue, 1),
				avgWeightedScore: rounded(weightedTotal.meanValue, 2),
				avgRawPercent: rounded(rawTotal.meanPercentage, 1),
				avgWeightedPercent: rounded(weightedTotal.meanPercentage, 1),
				rawPercentByDomain,
				weightedPercentByDomain
			};
		})
		.sort(
			(left, right) =>
				(right.avgWeightedPercent ?? Number.NEGATIVE_INFINITY) -
				(left.avgWeightedPercent ?? Number.NEGATIVE_INFINITY)
		);
}

export type DomainDelta = {
	domainKey: YeeDomainKey;
	label: string;
	first: number | null;
	latest: number | null;
	delta: number | null;
};

/**
 * Per-domain first-vs-latest raw-percent change across a place's audits (R3
 * change summary). Records are sorted by date ascending internally.
 */
export function firstVsLatestDeltas(records: PlaceComparisonAuditRecord[]): DomainDelta[] {
	if (records.length < 2) {
		return domainOrder.map(domain => ({
			domainKey: domain,
			label: domainLabels[domain],
			first: null,
			latest: null,
			delta: null
		}));
	}
	const sorted = [...records].sort((a, b) => timeOf(a.date) - timeOf(b.date));
	const firstRecord = sorted[0];
	const latestRecord = sorted[sorted.length - 1];
	const firstPercents = auditDomainRawPercents(firstRecord);
	const latestPercents = auditDomainRawPercents(latestRecord);
	return domainOrder.map(domain => {
		const first = rounded(firstPercents[domain], 1);
		const latest = rounded(latestPercents[domain], 1);
		return {
			domainKey: domain,
			label: domainLabels[domain],
			first,
			latest,
			delta: first === null || latest === null ? null : Number((latest - first).toFixed(1))
		};
	});
}

export type PairwiseDelta = {
	domainKey: YeeDomainKey;
	label: string;
	values: Array<number | null>;
	/** Present only when exactly two audits are compared. */
	delta?: number | null;
};

/**
 * Per-domain raw percentages for each selected audit (R4 domain delta table).
 * When exactly two audits are selected, includes an explicit Δ (second − first).
 */
export function pairwiseDomainDeltas(records: PlaceComparisonAuditRecord[]): PairwiseDelta[] {
	const perAudit = records.map(record => auditDomainRawPercents(record));
	return domainOrder.map(domain => {
		const values = perAudit.map(percents => rounded(percents[domain], 1));
		const row: PairwiseDelta = { domainKey: domain, label: domainLabels[domain], values };
		if (values.length === 2) {
			row.delta = values[0] === null || values[1] === null ? null : Number((values[1] - values[0]).toFixed(1));
		}
		return row;
	});
}

function timeOf(date: string): number {
	const parsed = new Date(date);
	// Unparseable/empty dates sort LAST — not to epoch 0, which would wrongly make
	// an undated record the "earliest"/first endpoint in first-vs-latest deltas.
	return Number.isNaN(parsed.getTime()) ? Number.POSITIVE_INFINITY : parsed.getTime();
}
