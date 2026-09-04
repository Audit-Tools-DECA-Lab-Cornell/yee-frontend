/**
 * Reporting maxima are canonical backend data. These pass-through helpers stay
 * at the proxy boundary only to preserve the route API while ensuring the
 * frontend never invents scoring contracts for old or corrupt snapshots.
 */
export function normalizeAuditListPayload(payload: unknown): unknown {
	return payload;
}

export function normalizePlaceComparisonGroupsPayload(payload: unknown): unknown {
	return payload;
}

export function normalizePlaceDetailPayload(payload: unknown): unknown {
	return payload;
}
