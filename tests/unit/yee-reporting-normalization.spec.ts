import { expect, test } from "@playwright/test";

import {
	normalizeAuditListPayload,
	normalizePlaceComparisonGroupsPayload,
	normalizePlaceDetailPayload
} from "../../src/server/backend/yee-reporting-normalization";

test("normalizeAuditListPayload fills in missing total maxima from YEE reporting rules", () => {
	const payload = [
		{
			id: "audit-1",
			total_raw_score: 56,
			total_weighted_score: 1.03,
			domain_weights: {
				access: 2,
				activitySpaces: 1,
				amenities: 2,
				experienceOfSpace: 3,
				aestheticsAndCare: 2,
				useAndUsability: 2
			}
		}
	];

	const [normalized] = normalizeAuditListPayload(payload) as Array<Record<string, unknown>>;
	expect(normalized.total_raw_maximum).toBe(125);
	expect(normalized.total_weighted_maximum).toBe(1.83);
});

test("normalizePlaceComparisonGroupsPayload restores missing domain maxima for comparison rows", () => {
	const payload = [
		{
			place_id: "place-1",
			audits: [
				{
					audit_id: "submission-1",
					total_raw_score: 56,
					total_weighted_score: 1.03,
					domain_weights: {
						access: 2,
						activitySpaces: 1,
						amenities: 2,
						experienceOfSpace: 3,
						aestheticsAndCare: 2,
						useAndUsability: 2
					},
					raw_domain_scores: {
						access: 7,
						activitySpaces: 13,
						amenities: 11,
						experienceOfSpace: 12,
						aestheticsAndCare: 5,
						useAndUsability: 8
					},
					weighted_domain_scores: {
						access: 0.19,
						activitySpaces: 0.11,
						amenities: 0.18,
						experienceOfSpace: 0.3,
						aestheticsAndCare: 0.08,
						useAndUsability: 0.17
					}
				}
			]
		}
	];

	const [group] = normalizePlaceComparisonGroupsPayload(payload) as Array<Record<string, unknown>>;
	const [record] = group.audits as Array<Record<string, unknown>>;
	expect(record.total_raw_maximum).toBe(125);
	expect(record.total_weighted_maximum).toBe(1.83);
	expect(record.raw_domain_maximums).toEqual({
		access: 14,
		activitySpaces: 26,
		amenities: 23,
		experienceOfSpace: 20,
		aestheticsAndCare: 24,
		useAndUsability: 18
	});
	expect(record.weighted_domain_maximums).toEqual({
		access: 0.3,
		activitySpaces: 0.13,
		amenities: 0.3,
		experienceOfSpace: 0.5,
		aestheticsAndCare: 0.29,
		useAndUsability: 0.31
	});
});

test("normalizePlaceDetailPayload updates the embedded comparisons group", () => {
	const payload = {
		id: "place-1",
		comparisons: {
			place_id: "place-1",
			audits: [
				{
					audit_id: "submission-1",
					total_raw_score: 0,
					total_weighted_score: 0,
					domain_weights: {
						access: 0,
						activitySpaces: 0,
						amenities: 0,
						experienceOfSpace: 0,
						aestheticsAndCare: 0,
						useAndUsability: 0
					},
					raw_domain_scores: {
						access: 0,
						activitySpaces: 0,
						amenities: 0,
						experienceOfSpace: 0,
						aestheticsAndCare: 0,
						useAndUsability: 0
					},
					weighted_domain_scores: {
						access: 0,
						activitySpaces: 0,
						amenities: 0,
						experienceOfSpace: 0,
						aestheticsAndCare: 0,
						useAndUsability: 0
					}
				}
			]
		}
	};

	const normalized = normalizePlaceDetailPayload(payload) as Record<string, unknown>;
	const [record] = (normalized.comparisons as Record<string, Array<Record<string, unknown>>>).audits;
	expect(record.total_raw_maximum).toBe(125);
	expect(record.total_weighted_maximum).toBe(0);
});
