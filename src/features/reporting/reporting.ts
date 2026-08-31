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

function percentOf(score: number, maximum: number): number {
	return maximum > 0 ? (score / maximum) * 100 : 0;
}

/** The value every record agrees on, or `null` when they disagree. */
function sharedValue(values: number[]): number | null {
	const [first] = values;
	return values.every(value => value === first) ? first : null;
}

/**
 * Averages across a place's selected audits.
 *
 * Audits stamped with different instrument versions can be scored out of
 * different maxima, so an average raw score has no single denominator to show
 * against. Two separate sets of figures come back:
 *
 * - `avgRawByDomain` / `totalRawAverage` — mean raw points. Meaningful to label
 *   with a maximum only when `sharedRawDomainMaximums` / `totalRawMaximum` is
 *   non-null, i.e. every selected audit was scored out of the same total.
 * - `avgRawPercentByDomain` / `totalRawPercentAverage` — mean of each audit's
 *   own percentage. Always comparable, because every audit is measured against
 *   the maximum it was actually scored out of.
 *
 * Callers must never label a mean raw score with one audit's maximum: with
 * mixed versions that reports a fraction no audit ever produced.
 */
export function getComparisonAverages<
	T extends {
		total_raw_score: number;
		total_raw_maximum: number;
		total_weighted_score: number;
		raw_domain_scores: Record<(typeof domainOrder)[number], number>;
		raw_domain_maximums: Record<(typeof domainOrder)[number], number>;
		weighted_domain_scores: Record<(typeof domainOrder)[number], number>;
	}
>(records: T[]) {
	if (records.length === 0) return null;

	const avgRawByDomain = Object.fromEntries(domainOrder.map(domain => [domain, 0])) as Record<
		(typeof domainOrder)[number],
		number
	>;
	const avgWeightedByDomain = Object.fromEntries(domainOrder.map(domain => [domain, 0])) as Record<
		(typeof domainOrder)[number],
		number
	>;

	for (const record of records) {
		for (const domain of domainOrder) {
			avgRawByDomain[domain] += record.raw_domain_scores[domain];
			avgWeightedByDomain[domain] += record.weighted_domain_scores[domain];
		}
	}

	for (const domain of domainOrder) {
		avgRawByDomain[domain] = Number((avgRawByDomain[domain] / records.length).toFixed(1));
		avgWeightedByDomain[domain] = Number((avgWeightedByDomain[domain] / records.length).toFixed(2));
	}

	const sharedRawDomainMaximums = Object.fromEntries(
		domainOrder.map(domain => [domain, sharedValue(records.map(record => record.raw_domain_maximums[domain]))])
	) as Record<(typeof domainOrder)[number], number | null>;
	const totalRawMaximum = sharedValue(records.map(record => record.total_raw_maximum));
	const avgRawPercentByDomain = Object.fromEntries(
		domainOrder.map(domain => [
			domain,
			Number(
				(
					records.reduce(
						(sum, record) =>
							sum + percentOf(record.raw_domain_scores[domain], record.raw_domain_maximums[domain]),
						0
					) / records.length
				).toFixed(1)
			)
		])
	) as Record<(typeof domainOrder)[number], number>;

	return {
		totalRawAverage: Number(
			(records.reduce((sum, record) => sum + record.total_raw_score, 0) / records.length).toFixed(1)
		),
		totalWeightedAverage: Number(
			(records.reduce((sum, record) => sum + record.total_weighted_score, 0) / records.length).toFixed(2)
		),
		totalRawPercentAverage: Number(
			(
				records.reduce((sum, record) => sum + percentOf(record.total_raw_score, record.total_raw_maximum), 0) /
				records.length
			).toFixed(1)
		),
		avgRawByDomain,
		avgRawPercentByDomain,
		avgWeightedByDomain,
		/** Per-domain maximum every selected audit shares, or `null` if they differ. */
		sharedRawDomainMaximums,
		/** Total maximum every selected audit shares, or `null` if they differ. */
		totalRawMaximum,
		/** Whether one maximum describes every selected audit, totals and domains alike. */
		hasSharedMaximums:
			totalRawMaximum !== null && domainOrder.every(domain => sharedRawDomainMaximums[domain] !== null)
	};
}

export { toCsv } from "@/lib/csv/to-csv";
