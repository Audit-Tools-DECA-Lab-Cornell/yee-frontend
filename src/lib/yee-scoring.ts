import { yeeDomainLabels, type YeeAuditDraft, type YeeDomainKey, type YeeScorePreview } from "@/lib/yee-audit-config";

export type BackendScoreResponse = {
	total_score: number;
	section_scores: Record<string, number>;
	category_scores: Record<string, number>;
	matched_scored_answers: number;
};

function sectionToDomain(sectionName: string): YeeDomainKey | null {
	const normalized = sectionName.toLowerCase();
	if (normalized.includes("access")) return "access";
	if (normalized.includes("activity spaces")) return "activitySpaces";
	if (normalized.includes("amenities")) return "amenities";
	if (normalized.includes("experience")) return "experienceOfSpace";
	if (normalized.includes("aesthetics")) return "aestheticsAndCare";
	if (normalized.includes("use & usability")) return "useAndUsability";
	return null;
}

export async function fetchScorePreview(responses: YeeAuditDraft["responses"]) {
	const response = await fetch("/api/yee/audits/score", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ responses })
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Score preview failed (${response.status}): ${body}`);
	}

	return (await response.json()) as BackendScoreResponse;
}

export function buildWeightedScorePreview(
	backendScore: BackendScoreResponse,
	weights: YeeAuditDraft["weights"]
): YeeScorePreview {
	const rawDomainScores = {
		access: 0,
		activitySpaces: 0,
		amenities: 0,
		experienceOfSpace: 0,
		aestheticsAndCare: 0,
		useAndUsability: 0
	} satisfies Record<YeeDomainKey, number>;

	for (const [sectionName, score] of Object.entries(backendScore.section_scores)) {
		const domain = sectionToDomain(sectionName);
		if (!domain) continue;
		rawDomainScores[domain] += score;
	}

	const weightedDomainScores = Object.fromEntries(
		(Object.keys(rawDomainScores) as YeeDomainKey[]).map(domain => {
			const weight = Number(weights[domain] || 0);
			return [domain, rawDomainScores[domain] * weight];
		})
	) as Record<YeeDomainKey, number>;

	return {
		rawDomainScores,
		weightedDomainScores,
		totalRawScore: Object.values(rawDomainScores).reduce((sum, value) => sum + value, 0),
		totalWeightedScore: Object.values(weightedDomainScores).reduce((sum, value) => sum + value, 0),
		matchedScoredAnswers: backendScore.matched_scored_answers,
		categoryScores: backendScore.category_scores
	};
}

export function getScoreRows(preview: YeeScorePreview) {
	return (Object.keys(yeeDomainLabels) as YeeDomainKey[]).map(domain => ({
		domain,
		label: yeeDomainLabels[domain],
		rawScore: preview.rawDomainScores[domain],
		weightedScore: preview.weightedDomainScores[domain]
	}));
}
