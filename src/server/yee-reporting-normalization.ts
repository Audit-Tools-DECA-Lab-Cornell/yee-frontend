const yeeDomains = [
	"access",
	"activitySpaces",
	"amenities",
	"experienceOfSpace",
	"aestheticsAndCare",
	"useAndUsability"
] as const;

type YeeDomainKey = (typeof yeeDomains)[number];
type YeeDomainScores = Record<YeeDomainKey, number>;
type JsonRecord = Record<string, unknown>;

const RAW_DOMAIN_MAXIMUMS = {
	access: 14,
	activitySpaces: 26,
	amenities: 23,
	experienceOfSpace: 20,
	aestheticsAndCare: 24,
	useAndUsability: 18
} as const satisfies YeeDomainScores;

const MAXIMUM_DOMAIN_AVERAGES = {
	access: 1.75,
	activitySpaces: 1.63,
	amenities: 1.77,
	experienceOfSpace: 2,
	aestheticsAndCare: 1.71,
	useAndUsability: 1.8
} as const satisfies YeeDomainScores;

const EMPTY_DOMAIN_SCORES = {
	access: 0,
	activitySpaces: 0,
	amenities: 0,
	experienceOfSpace: 0,
	aestheticsAndCare: 0,
	useAndUsability: 0
} as const satisfies YeeDomainScores;

const TOTAL_RAW_MAXIMUM = 125;

function isRecord(value: unknown): value is JsonRecord {
	return typeof value === "object" && value !== null;
}

function asFiniteNumber(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function roundToTwo(value: number): number {
	return Number(value.toFixed(2));
}

function hasCompleteDomainScores(value: unknown): value is YeeDomainScores {
	if (!isRecord(value)) {
		return false;
	}

	return yeeDomains.every(domain => typeof value[domain] === "number" && Number.isFinite(value[domain]));
}

function toDomainWeights(value: unknown): YeeDomainScores {
	if (!isRecord(value)) {
		return { ...EMPTY_DOMAIN_SCORES };
	}

	const entries = yeeDomains.map(domain => {
		const current = value[domain];
		if (current === "1" || current === "2" || current === "3") {
			return [domain, Number(current)] as const;
		}

		return [domain, asFiniteNumber(current) ?? 0] as const;
	});

	return Object.fromEntries(entries) as YeeDomainScores;
}

function normalizeWeights(domainWeights: YeeDomainScores): YeeDomainScores {
	const total = yeeDomains.reduce((sum, domain) => sum + domainWeights[domain], 0);
	if (total <= 0) {
		return { ...EMPTY_DOMAIN_SCORES };
	}

	return Object.fromEntries(
		yeeDomains.map(domain => [domain, roundToTwo(domainWeights[domain] / total)])
	) as YeeDomainScores;
}

function buildWeightedDomainMaximums(domainWeights: YeeDomainScores): YeeDomainScores {
	const normalizedWeights = normalizeWeights(domainWeights);
	return Object.fromEntries(
		yeeDomains.map(domain => [domain, roundToTwo(MAXIMUM_DOMAIN_AVERAGES[domain] * normalizedWeights[domain])])
	) as YeeDomainScores;
}

function sumDomainScores(domainScores: YeeDomainScores): number {
	return roundToTwo(yeeDomains.reduce((sum, domain) => sum + domainScores[domain], 0));
}

function normalizeAuditRecord(record: JsonRecord): JsonRecord {
	const domainWeights = toDomainWeights(record.domain_weights);
	const weightedDomainMaximums = buildWeightedDomainMaximums(domainWeights);

	return {
		...record,
		total_raw_maximum: asFiniteNumber(record.total_raw_maximum) ?? TOTAL_RAW_MAXIMUM,
		total_weighted_maximum: asFiniteNumber(record.total_weighted_maximum) ?? sumDomainScores(weightedDomainMaximums)
	};
}

function normalizeComparisonAuditRecord(record: JsonRecord): JsonRecord {
	const domainWeights = toDomainWeights(record.domain_weights);
	const weightedDomainMaximums = hasCompleteDomainScores(record.weighted_domain_maximums)
		? record.weighted_domain_maximums
		: buildWeightedDomainMaximums(domainWeights);

	return {
		...record,
		total_raw_maximum: asFiniteNumber(record.total_raw_maximum) ?? TOTAL_RAW_MAXIMUM,
		total_weighted_maximum:
			asFiniteNumber(record.total_weighted_maximum) ?? sumDomainScores(weightedDomainMaximums),
		raw_domain_maximums: hasCompleteDomainScores(record.raw_domain_maximums)
			? record.raw_domain_maximums
			: RAW_DOMAIN_MAXIMUMS,
		weighted_domain_maximums: weightedDomainMaximums
	};
}

function normalizeComparisonGroupRecord(record: JsonRecord): JsonRecord {
	if (!Array.isArray(record.audits)) {
		return record;
	}

	return {
		...record,
		audits: record.audits.map(audit => (isRecord(audit) ? normalizeComparisonAuditRecord(audit) : audit))
	};
}

export function normalizeAuditListPayload(payload: unknown): unknown {
	if (!Array.isArray(payload)) {
		return payload;
	}

	return payload.map(row => (isRecord(row) ? normalizeAuditRecord(row) : row));
}

export function normalizePlaceComparisonGroupsPayload(payload: unknown): unknown {
	if (!Array.isArray(payload)) {
		return payload;
	}

	return payload.map(group => (isRecord(group) ? normalizeComparisonGroupRecord(group) : group));
}

export function normalizePlaceDetailPayload(payload: unknown): unknown {
	if (!isRecord(payload) || !isRecord(payload.comparisons)) {
		return payload;
	}

	return {
		...payload,
		comparisons: normalizeComparisonGroupRecord(payload.comparisons)
	};
}
