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

export function getComparisonAverages<
	T extends {
		total_raw_score: number;
		total_weighted_score: number;
		raw_domain_scores: Record<(typeof domainOrder)[number], number>;
		weighted_domain_scores: Record<(typeof domainOrder)[number], number>;
	}
>(records: T[]) {
	if (records.length === 0) return null;

	const avgRawByDomain = Object.fromEntries(domainOrder.map(domain => [domain, 0])) as Record<(typeof domainOrder)[number], number>;
	const avgWeightedByDomain = Object.fromEntries(domainOrder.map(domain => [domain, 0])) as Record<(typeof domainOrder)[number], number>;

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

	return {
		totalRawAverage: Number((records.reduce((sum, record) => sum + record.total_raw_score, 0) / records.length).toFixed(1)),
		totalWeightedAverage: Number((records.reduce((sum, record) => sum + record.total_weighted_score, 0) / records.length).toFixed(2)),
		avgRawByDomain,
		avgWeightedByDomain
	};
}

export { toCsv } from "@/lib/csv/to-csv";
