import { expect, test } from "@playwright/test";

import {
	normalizeAuditListPayload,
	normalizePlaceComparisonGroupsPayload,
	normalizePlaceDetailPayload
} from "../../src/server/yee-reporting-normalization";

test("normalizeAuditListPayload preserves missing and null maxima", () => {
	const payload = [
		{
			id: "audit-1",
			total_raw_score: 56,
			total_weighted_score: 1.03,
			total_weighted_maximum: null
		}
	];

	const [normalized] = normalizeAuditListPayload(payload) as Array<Record<string, unknown>>;
	expect(normalized).toEqual(payload[0]);
	expect("total_raw_maximum" in normalized).toBe(false);
	expect(normalized.total_weighted_maximum).toBeNull();
});

test("normalizePlaceComparisonGroupsPayload passes canonical maxima through unchanged", () => {
	const payload = [
		{
			place_id: "place-1",
			audits: [
				{
					audit_id: "submission-1",
					total_raw_score: 56,
					total_raw_maximum: 140,
					total_weighted_score: 1.03,
					total_weighted_maximum: 2.4,
					raw_domain_maximums: { access: 20 },
					weighted_domain_maximums: { access: 0.4 }
				}
			]
		}
	];

	expect(normalizePlaceComparisonGroupsPayload(payload)).toBe(payload);
});

test("normalizePlaceDetailPayload does not synthesize embedded comparison maxima", () => {
	const payload = {
		id: "place-1",
		comparisons: {
			place_id: "place-1",
			audits: [
				{
					audit_id: "submission-1",
					total_raw_score: 0,
					total_weighted_score: 0,
					total_raw_maximum: null,
					total_weighted_maximum: null
				}
			]
		}
	};

	expect(normalizePlaceDetailPayload(payload)).toBe(payload);
});
