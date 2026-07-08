import type { PlaceComparisonAuditRecord } from "../../src/features/workspaces/api/live-api";

/** Two places, three audits — enough to exercise summaries, trend, and deltas. */
function record(overrides: Partial<PlaceComparisonAuditRecord> & { audit_id: string }): PlaceComparisonAuditRecord {
	return {
		auditor_id: "AUD007",
		place_id: "place-a",
		place_name: "Riverside Park",
		project_id: "proj-1",
		project_name: "Downtown Greening",
		date: "2026-01-15",
		total_raw_score: 56,
		total_raw_maximum: 125,
		total_weighted_score: 1.03,
		total_weighted_maximum: 1.83,
		domain_weights: { access: 2, activitySpaces: 1, amenities: 2, experienceOfSpace: 3, aestheticsAndCare: 2, useAndUsability: 2 },
		raw_domain_scores: { access: 7, activitySpaces: 13, amenities: 9, experienceOfSpace: 11, aestheticsAndCare: 8, useAndUsability: 8 },
		raw_domain_maximums: { access: 15, activitySpaces: 25, amenities: 20, experienceOfSpace: 25, aestheticsAndCare: 20, useAndUsability: 20 },
		weighted_domain_scores: { access: 0.14, activitySpaces: 0.31, amenities: 0.18, experienceOfSpace: 0.22, aestheticsAndCare: 0.1, useAndUsability: 0.08 },
		weighted_domain_maximums: { access: 0.3, activitySpaces: 0.37, amenities: 0.3, experienceOfSpace: 0.37, aestheticsAndCare: 0.25, useAndUsability: 0.24 },
		...overrides
	};
}

export const comparisonRecords: PlaceComparisonAuditRecord[] = [
	record({ audit_id: "a1", date: "2026-01-15", total_raw_score: 56, total_weighted_score: 1.03 }),
	record({ audit_id: "a2", date: "2026-04-20", total_raw_score: 74, total_weighted_score: 1.31, raw_domain_scores: { access: 11, activitySpaces: 18, amenities: 13, experienceOfSpace: 15, aestheticsAndCare: 9, useAndUsability: 8 } }),
	record({
		audit_id: "b1",
		place_id: "place-b",
		place_name: "Lincoln Square",
		date: "2026-03-02",
		total_raw_score: 62,
		total_weighted_score: 1.12,
		auditor_id: "AUD012"
	})
];
