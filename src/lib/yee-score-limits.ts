import type { YeeDomainKey } from "@/lib/yee-audit-config";

export const rawDomainScoreMaximums: Record<YeeDomainKey, number> = {
	access: 14,
	activitySpaces: 26,
	amenities: 23,
	experienceOfSpace: 20,
	aestheticsAndCare: 24,
	useAndUsability: 18
};

export const rawDomainQuestionCounts: Record<YeeDomainKey, number> = {
	access: 8,
	activitySpaces: 16,
	amenities: 13,
	experienceOfSpace: 10,
	aestheticsAndCare: 14,
	useAndUsability: 10
};

export const totalRawScoreMaximum = Object.values(rawDomainScoreMaximums).reduce((sum, value) => sum + value, 0);

function round2(value: number) {
	return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeWeightValue(weight: string | number | null | undefined) {
	const numeric = Number(weight);
	if (Number.isFinite(numeric) && numeric >= 1 && numeric <= 3) return numeric;
	return 0;
}

export function getNormalizedWeights(weights?: Partial<Record<YeeDomainKey, string | number>>) {
	const selectedWeights = Object.fromEntries(
		(Object.keys(rawDomainScoreMaximums) as YeeDomainKey[]).map(domain => [
			domain,
			normalizeWeightValue(weights?.[domain])
		])
	) as Record<YeeDomainKey, number>;
	const totalWeight = Object.values(selectedWeights).reduce((sum, value) => sum + value, 0);
	const normalizedWeights = Object.fromEntries(
		(Object.keys(rawDomainScoreMaximums) as YeeDomainKey[]).map(domain => [
			domain,
			totalWeight > 0 ? round2(selectedWeights[domain] / totalWeight) : 0
		])
	) as Record<YeeDomainKey, number>;

	return {
		selectedWeights,
		normalizedWeights,
		totalWeight
	};
}

export function getDomainMaximumAverage(domain: YeeDomainKey) {
	return round2(rawDomainScoreMaximums[domain] / rawDomainQuestionCounts[domain]);
}

export function getDomainYouthWeightedMaximum(
	domain: YeeDomainKey,
	weights?: Partial<Record<YeeDomainKey, string | number>>
) {
	const { normalizedWeights } = getNormalizedWeights(weights);
	return round2(getDomainMaximumAverage(domain) * normalizedWeights[domain]);
}

export function getYouthWeightedScoreMaximum(weights?: Partial<Record<YeeDomainKey, string | number>>) {
	return round2(
		(Object.keys(rawDomainScoreMaximums) as YeeDomainKey[]).reduce(
			(sum, domain) => sum + getDomainYouthWeightedMaximum(domain, weights),
			0
		)
	);
}
