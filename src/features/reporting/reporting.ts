import { aggregateScoreEntries } from "@/lib/score-format";

export const domainOrder = [
	"access",
	"activitySpaces",
	"amenities",
	"experienceOfSpace",
	"aestheticsAndCare",
	"useAndUsability"
] as const;

export const domainLabels: Record<(typeof domainOrder)[number], string> = {
	access: "Access",
	activitySpaces: "Activity Spaces",
	amenities: "Amenities",
	experienceOfSpace: "Experience of the Space",
	aestheticsAndCare: "Aesthetics & Care",
	useAndUsability: "Use & Usability"
};

function roundNullable(value: number | null, fractionDigits: number): number | null {
	return value === null ? null : Number(value.toFixed(fractionDigits));
}

/**
 * Averages across a place's selected audits.
 *
 * Audits stamped with different instrument versions can be scored out of
 * different maxima, so an average raw or youth-weighted score has no single
 * denominator to show against. Each scale comes back as two sets of figures:
 *
 * - `avgRawByDomain` / `totalRawAverage` — mean raw points. Meaningful to label
 *   with a maximum only when `sharedRawDomainMaximums` / `totalRawMaximum` is
 *   non-null, i.e. every selected audit was scored out of the same total.
 * - `avgRawPercentByDomain` / `totalRawPercentAverage` — mean of each audit's
 *   own percentage. Always comparable, because every audit is measured against
 *   the maximum it was actually scored out of.
 * - `avgWeightedByDomain` / `totalWeightedAverage` — mean youth-weighted points.
 *   Meaningful to label with a maximum only when `sharedWeightedDomainMaximums`
 *   / `totalWeightedMaximum` is non-null.
 * - `avgWeightedPercentByDomain` / `totalWeightedPercentAverage` — mean of each
 *   audit's own youth-weighted percentage. Always comparable, for the same
 *   reason.
 *
 * Callers must never label a mean raw or youth-weighted score with one audit's
 * maximum: with mixed versions that reports a fraction no audit ever produced.
 */
export function getComparisonAverages<
	T extends {
		total_raw_score: number;
		total_raw_maximum: number;
		total_weighted_score: number;
		total_weighted_maximum: number;
		raw_domain_scores: Record<(typeof domainOrder)[number], number>;
		raw_domain_maximums: Record<(typeof domainOrder)[number], number>;
		weighted_domain_scores: Record<(typeof domainOrder)[number], number>;
		weighted_domain_maximums: Record<(typeof domainOrder)[number], number>;
	}
>(records: T[]) {
	if (records.length === 0) return null;

	const rawDomainAggregates = Object.fromEntries(
		domainOrder.map(domain => [
			domain,
			aggregateScoreEntries(
				records.map(record => ({
					value: record.raw_domain_scores[domain],
					maximum: record.raw_domain_maximums[domain]
				}))
			)
		])
	) as Record<(typeof domainOrder)[number], ReturnType<typeof aggregateScoreEntries>>;
	const weightedDomainAggregates = Object.fromEntries(
		domainOrder.map(domain => [
			domain,
			aggregateScoreEntries(
				records.map(record => ({
					value: record.weighted_domain_scores[domain],
					maximum: record.weighted_domain_maximums[domain]
				}))
			)
		])
	) as Record<(typeof domainOrder)[number], ReturnType<typeof aggregateScoreEntries>>;
	const rawTotalAggregate = aggregateScoreEntries(
		records.map(record => ({ value: record.total_raw_score, maximum: record.total_raw_maximum }))
	);
	const weightedTotalAggregate = aggregateScoreEntries(
		records.map(record => ({ value: record.total_weighted_score, maximum: record.total_weighted_maximum }))
	);

	const avgRawByDomain = Object.fromEntries(
		domainOrder.map(domain => [domain, roundNullable(rawDomainAggregates[domain].meanValue, 1)])
	) as Record<(typeof domainOrder)[number], number | null>;
	const avgRawPercentByDomain = Object.fromEntries(
		domainOrder.map(domain => [domain, roundNullable(rawDomainAggregates[domain].meanPercentage, 1)])
	) as Record<(typeof domainOrder)[number], number | null>;
	const avgWeightedByDomain = Object.fromEntries(
		domainOrder.map(domain => [domain, roundNullable(weightedDomainAggregates[domain].meanValue, 2)])
	) as Record<(typeof domainOrder)[number], number | null>;
	const avgWeightedPercentByDomain = Object.fromEntries(
		domainOrder.map(domain => [domain, roundNullable(weightedDomainAggregates[domain].meanPercentage, 1)])
	) as Record<(typeof domainOrder)[number], number | null>;
	const sharedRawDomainMaximums = Object.fromEntries(
		domainOrder.map(domain => [domain, rawDomainAggregates[domain].sharedMaximum])
	) as Record<(typeof domainOrder)[number], number | null>;
	const sharedWeightedDomainMaximums = Object.fromEntries(
		domainOrder.map(domain => [domain, weightedDomainAggregates[domain].sharedMaximum])
	) as Record<(typeof domainOrder)[number], number | null>;
	const rawDomainValidCounts = Object.fromEntries(
		domainOrder.map(domain => [domain, rawDomainAggregates[domain].validCount])
	) as Record<(typeof domainOrder)[number], number>;
	const weightedDomainValidCounts = Object.fromEntries(
		domainOrder.map(domain => [domain, weightedDomainAggregates[domain].validCount])
	) as Record<(typeof domainOrder)[number], number>;

	return {
		totalRawAverage: roundNullable(rawTotalAggregate.meanValue, 1),
		totalWeightedAverage: roundNullable(weightedTotalAggregate.meanValue, 2),
		totalRawPercentAverage: roundNullable(rawTotalAggregate.meanPercentage, 1),
		totalWeightedPercentAverage: roundNullable(weightedTotalAggregate.meanPercentage, 1),
		totalRawValidCount: rawTotalAggregate.validCount,
		totalWeightedValidCount: weightedTotalAggregate.validCount,
		avgRawByDomain,
		avgRawPercentByDomain,
		avgWeightedByDomain,
		avgWeightedPercentByDomain,
		/** Per-domain count used by the raw means after excluding invalid rows. */
		rawDomainValidCounts,
		/** Per-domain count used by the youth-weighted means after excluding invalid rows. */
		weightedDomainValidCounts,
		/** Per-domain raw maximum every selected audit shares, or `null` if they differ. */
		sharedRawDomainMaximums,
		/** Total raw maximum every selected audit shares, or `null` if they differ. */
		totalRawMaximum: rawTotalAggregate.sharedMaximum,
		/** Whether one raw maximum describes every selected audit, totals and domains alike. */
		hasSharedMaximums:
			rawTotalAggregate.sharedMaximum !== null &&
			rawTotalAggregate.validCount === records.length &&
			domainOrder.every(
				domain =>
					sharedRawDomainMaximums[domain] !== null &&
					rawDomainAggregates[domain].validCount === records.length
			),
		/** Per-domain youth-weighted maximum every selected audit shares, or `null` if they differ. */
		sharedWeightedDomainMaximums,
		/** Total youth-weighted maximum every selected audit shares, or `null` if they differ. */
		totalWeightedMaximum: weightedTotalAggregate.sharedMaximum,
		/** Whether one youth-weighted maximum describes every selected audit, totals and domains alike. */
		hasSharedWeightedMaximums:
			weightedTotalAggregate.sharedMaximum !== null &&
			weightedTotalAggregate.validCount === records.length &&
			domainOrder.every(
				domain =>
					sharedWeightedDomainMaximums[domain] !== null &&
					weightedDomainAggregates[domain].validCount === records.length
			)
	};
}

export { toCsv } from "@/lib/csv/to-csv";
