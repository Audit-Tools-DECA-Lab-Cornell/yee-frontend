import type { YeeDomainKey } from "@/lib/yee-audit-config";

export const rawDomainScoreMaximums: Record<YeeDomainKey, number> = {
	access: 14,
	activitySpaces: 26,
	amenities: 23,
	experienceOfSpace: 20,
	aestheticsAndCare: 24,
	useAndUsability: 18
};

export const totalRawScoreMaximum = Object.values(rawDomainScoreMaximums).reduce((sum, value) => sum + value, 0);
export const totalYouthWeightedScoreMaximum = totalRawScoreMaximum * 3;

function normalizeWeightValue(weight: string | number | null | undefined) {
	const numeric = Number(weight);
	if (Number.isFinite(numeric) && numeric >= 1 && numeric <= 3) return numeric;
	return 1;
}

export function getYouthWeightedScoreMaximum(weights?: Partial<Record<YeeDomainKey, string | number>>) {
	if (!weights) return totalYouthWeightedScoreMaximum;
	return (Object.keys(rawDomainScoreMaximums) as YeeDomainKey[]).reduce(
		(sum, domain) => sum + rawDomainScoreMaximums[domain] * normalizeWeightValue(weights[domain]),
		0
	);
}
