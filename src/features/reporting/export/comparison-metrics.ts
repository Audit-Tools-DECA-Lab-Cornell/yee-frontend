/**
 * Shared comparison math for the dashboard and the R2/R3/R4 exports. The on-
 * screen dashboard imports the percentage helpers so the exported figures are
 * computed by the same functions the user saw (plan acceptance criterion 3).
 * The delta helpers are the "intervention story" content that debuts in exports
 * (logistics §6).
 */
import type { PlaceComparisonAuditRecord } from "@/features/workspaces/api/live-api";

import { domainLabels, domainOrder, type PlaceComparisonSummary, type YeeDomainKey } from "./types";

export function clampPercentage(value: number): number {
	return Math.max(0, Math.min(100, value));
}

export function percentage(numerator: number, denominator: number): number {
	if (!denominator) return 0;
	return clampPercentage((numerator / denominator) * 100);
}

export function auditRawPercent(record: PlaceComparisonAuditRecord): number {
	return percentage(record.total_raw_score, record.total_raw_maximum);
}

export function auditWeightedPercent(record: PlaceComparisonAuditRecord): number {
	return percentage(record.total_weighted_score, record.total_weighted_maximum);
}

/** Per-domain raw percentages for one audit, in domain order. */
export function auditDomainRawPercents(record: PlaceComparisonAuditRecord): Record<YeeDomainKey, number> {
	return Object.fromEntries(
		domainOrder.map(domain => [
			domain,
			percentage(record.raw_domain_scores[domain], record.raw_domain_maximums[domain])
		])
	) as Record<YeeDomainKey, number>;
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
			const rawPercentByDomain = Object.fromEntries(domainOrder.map(domain => [domain, 0])) as Record<
				YeeDomainKey,
				number
			>;
			const weightedPercentByDomain = Object.fromEntries(domainOrder.map(domain => [domain, 0])) as Record<
				YeeDomainKey,
				number
			>;
			for (const record of placeRecords) {
				for (const domain of domainOrder) {
					rawPercentByDomain[domain] += percentage(
						record.raw_domain_scores[domain],
						record.raw_domain_maximums[domain]
					);
					weightedPercentByDomain[domain] += percentage(
						record.weighted_domain_scores[domain],
						record.weighted_domain_maximums[domain]
					);
				}
			}
			for (const domain of domainOrder) {
				rawPercentByDomain[domain] = Number((rawPercentByDomain[domain] / placeRecords.length).toFixed(1));
				weightedPercentByDomain[domain] = Number(
					(weightedPercentByDomain[domain] / placeRecords.length).toFixed(1)
				);
			}
			return {
				placeId: first.place_id,
				placeName: first.place_name,
				projectName: first.project_name,
				auditCount: placeRecords.length,
				avgRawScore: Number(
					(placeRecords.reduce((sum, r) => sum + r.total_raw_score, 0) / placeRecords.length).toFixed(1)
				),
				avgWeightedScore: Number(
					(placeRecords.reduce((sum, r) => sum + r.total_weighted_score, 0) / placeRecords.length).toFixed(2)
				),
				avgRawPercent: Number(
					(placeRecords.reduce((sum, r) => sum + auditRawPercent(r), 0) / placeRecords.length).toFixed(1)
				),
				avgWeightedPercent: Number(
					(placeRecords.reduce((sum, r) => sum + auditWeightedPercent(r), 0) / placeRecords.length).toFixed(1)
				),
				rawPercentByDomain,
				weightedPercentByDomain
			};
		})
		.sort((left, right) => right.avgWeightedScore - left.avgWeightedScore);
}

export type DomainDelta = {
	domainKey: YeeDomainKey;
	label: string;
	first: number;
	latest: number;
	delta: number;
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
			first: 0,
			latest: 0,
			delta: 0
		}));
	}
	const sorted = [...records].sort((a, b) => timeOf(a.date) - timeOf(b.date));
	const firstRecord = sorted[0];
	const latestRecord = sorted[sorted.length - 1];
	const firstPercents = auditDomainRawPercents(firstRecord);
	const latestPercents = auditDomainRawPercents(latestRecord);
	return domainOrder.map(domain => {
		const first = Number(firstPercents[domain].toFixed(1));
		const latest = Number(latestPercents[domain].toFixed(1));
		return {
			domainKey: domain,
			label: domainLabels[domain],
			first,
			latest,
			delta: Number((latest - first).toFixed(1))
		};
	});
}

export type PairwiseDelta = {
	domainKey: YeeDomainKey;
	label: string;
	values: number[];
	/** Present only when exactly two audits are compared. */
	delta?: number;
};

/**
 * Per-domain raw percentages for each selected audit (R4 domain delta table).
 * When exactly two audits are selected, includes an explicit Δ (second − first).
 */
export function pairwiseDomainDeltas(records: PlaceComparisonAuditRecord[]): PairwiseDelta[] {
	const perAudit = records.map(record => auditDomainRawPercents(record));
	return domainOrder.map(domain => {
		const values = perAudit.map(percents => Number(percents[domain].toFixed(1)));
		const row: PairwiseDelta = { domainKey: domain, label: domainLabels[domain], values };
		if (values.length === 2) row.delta = Number((values[1] - values[0]).toFixed(1));
		return row;
	});
}

function timeOf(date: string): number {
	const parsed = new Date(date);
	// Unparseable/empty dates sort LAST — not to epoch 0, which would wrongly make
	// an undated record the "earliest"/first endpoint in first-vs-latest deltas.
	return Number.isNaN(parsed.getTime()) ? Number.POSITIVE_INFINITY : parsed.getTime();
}
