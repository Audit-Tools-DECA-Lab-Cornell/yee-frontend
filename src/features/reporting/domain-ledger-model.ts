import { domainOrder, getComparisonAverages } from "@/features/reporting/reporting";
import type { PlaceComparisonAuditRecord } from "@/features/workspaces/api/live-api";
import { formatScoreFraction, SCORE_UNAVAILABLE, scorePercent } from "@/lib/score-format";

export type DomainLedgerMetric = "raw" | "weighted";
export type DomainLedgerDomain = (typeof domainOrder)[number];

export type DomainLedgerScore = {
	readonly percent: number | null;
	readonly fraction: string;
};

export type DomainLedgerCell = DomainLedgerScore & {
	readonly domain: DomainLedgerDomain;
};

export type DomainLedgerAverageScore = DomainLedgerScore & {
	readonly detail?: string;
};

export type DomainLedgerAverageCell = DomainLedgerAverageScore & {
	readonly domain: DomainLedgerDomain;
};

export type DomainLedgerAverage = {
	readonly overall: DomainLedgerAverageScore;
	readonly domains: readonly DomainLedgerAverageCell[];
};

export type DomainLedgerRow = {
	readonly auditId: string;
	readonly auditorId: string;
	readonly participantId: string | null;
	readonly date: string;
	readonly overall: DomainLedgerScore;
	readonly domains: readonly DomainLedgerCell[];
};

export type DomainLedgerModel = {
	readonly metric: DomainLedgerMetric;
	readonly rows: readonly DomainLedgerRow[];
	readonly average: DomainLedgerAverage | null;
};

const FRACTION_DIGITS: Readonly<Record<DomainLedgerMetric, number>> = {
	raw: 0,
	weighted: 2
};

function score(value: number, maximum: number, metric: DomainLedgerMetric): DomainLedgerScore {
	return {
		percent: scorePercent(value, maximum),
		fraction: formatScoreFraction(value, maximum, FRACTION_DIGITS[metric])
	};
}

function domainCell(
	record: PlaceComparisonAuditRecord,
	domain: DomainLedgerDomain,
	metric: DomainLedgerMetric
): DomainLedgerCell {
	const domainScore = metric === "raw" ? record.raw_domain_scores[domain] : record.weighted_domain_scores[domain];
	const domainMaximum =
		metric === "raw" ? record.raw_domain_maximums[domain] : record.weighted_domain_maximums[domain];
	return { domain, ...score(domainScore, domainMaximum, metric) };
}

function row(record: PlaceComparisonAuditRecord, metric: DomainLedgerMetric): DomainLedgerRow {
	const totalScore = metric === "raw" ? record.total_raw_score : record.total_weighted_score;
	const totalMaximum = metric === "raw" ? record.total_raw_maximum : record.total_weighted_maximum;
	return {
		auditId: record.audit_id,
		auditorId: record.auditor_id,
		participantId: record.participant_id ?? null,
		date: record.date,
		overall: score(totalScore, totalMaximum, metric),
		domains: domainOrder.map(domain => domainCell(record, domain, metric))
	};
}

function compareRows(left: DomainLedgerRow, right: DomainLedgerRow): number {
	if (left.overall.percent === null) return right.overall.percent === null ? 0 : 1;
	if (right.overall.percent === null) return -1;
	return right.overall.percent - left.overall.percent;
}

function averageScore(
	percent: number | null,
	value: number | null,
	maximum: number | null,
	validCount: number,
	totalCount: number,
	fractionDigits: number
): DomainLedgerAverageScore {
	if (percent === null || validCount === 0) {
		return { percent: null, fraction: SCORE_UNAVAILABLE, detail: "Score unavailable" };
	}
	if (validCount < totalCount) {
		return {
			percent,
			fraction: SCORE_UNAVAILABLE,
			detail: `${validCount} of ${totalCount} scores available`
		};
	}
	if (value === null || maximum === null) {
		return { percent, fraction: SCORE_UNAVAILABLE, detail: "Mixed maximums" };
	}
	return { percent, fraction: formatScoreFraction(value, maximum, fractionDigits) };
}

function buildAverage(
	records: readonly PlaceComparisonAuditRecord[],
	metric: DomainLedgerMetric
): DomainLedgerAverage | null {
	const averages = getComparisonAverages([...records]);
	if (averages === null) return null;
	const digits = FRACTION_DIGITS[metric];
	const raw = metric === "raw";
	const totalCount = records.length;
	const overall = raw
		? averageScore(
				averages.totalRawPercentAverage,
				averages.totalRawAverage,
				averages.totalRawMaximum,
				averages.totalRawValidCount,
				totalCount,
				digits
			)
		: averageScore(
				averages.totalWeightedPercentAverage,
				averages.totalWeightedAverage,
				averages.totalWeightedMaximum,
				averages.totalWeightedValidCount,
				totalCount,
				digits
			);
	const domains = domainOrder.map(domain => ({
		domain,
		...(raw
			? averageScore(
					averages.avgRawPercentByDomain[domain],
					averages.avgRawByDomain[domain],
					averages.sharedRawDomainMaximums[domain],
					averages.rawDomainValidCounts[domain],
					totalCount,
					digits
				)
			: averageScore(
					averages.avgWeightedPercentByDomain[domain],
					averages.avgWeightedByDomain[domain],
					averages.sharedWeightedDomainMaximums[domain],
					averages.weightedDomainValidCounts[domain],
					totalCount,
					digits
				))
	}));
	return { overall, domains };
}

export function buildDomainLedgerModel(
	records: readonly PlaceComparisonAuditRecord[],
	metric: DomainLedgerMetric
): DomainLedgerModel {
	return {
		metric,
		rows: records.map(record => row(record, metric)).sort(compareRows),
		average: buildAverage(records, metric)
	};
}
