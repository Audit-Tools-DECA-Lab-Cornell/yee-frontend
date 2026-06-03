import { yeeDomainLabels, type YeeAuditDraft, type YeeDomainKey, type YeeScorePreview } from "@/lib/yee-audit-config";
import {
	getDomainMaximumAverage,
	getNormalizedWeights,
	rawDomainQuestionCounts
} from "@/lib/yee-score-limits";

export type BackendScoreResponse = {
	total_score: number;
	section_scores: Record<string, number>;
	category_scores: Record<string, number>;
	matched_scored_answers: number;
};

function round2(value: number) {
	return Math.round((value + Number.EPSILON) * 100) / 100;
}

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

export async function fetchScorePreview(
	placeId: string,
	participantInfo: Record<string, unknown>,
	responses: YeeAuditDraft["responses"]
) {
	const response = await fetch("/api/yee/audits/score", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ place_id: placeId, participant_info: participantInfo, responses })
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
			return [domain, 0];
		})
	) as Record<YeeDomainKey, number>;
	const unweightedDomainAverages = Object.fromEntries(
		(Object.keys(rawDomainScores) as YeeDomainKey[]).map(domain => [
			domain,
			round2(rawDomainScores[domain] / rawDomainQuestionCounts[domain])
		])
	) as Record<YeeDomainKey, number>;
	const { selectedWeights, normalizedWeights } = getNormalizedWeights(weights);
	const priorityGaps = Object.fromEntries(
		(Object.keys(rawDomainScores) as YeeDomainKey[]).map(domain => [
			domain,
			round2((getDomainMaximumAverage(domain) - unweightedDomainAverages[domain]) * selectedWeights[domain])
		])
	) as Record<YeeDomainKey, number>;

	for (const domain of Object.keys(rawDomainScores) as YeeDomainKey[]) {
		weightedDomainScores[domain] = round2(normalizedWeights[domain] * unweightedDomainAverages[domain]);
	}

	return {
		rawDomainScores,
		weightedDomainScores,
		selectedWeights,
		normalizedWeights,
		unweightedDomainAverages,
		priorityGaps,
		totalRawScore: Object.values(rawDomainScores).reduce((sum, value) => sum + value, 0),
		totalWeightedScore: round2(Object.values(weightedDomainScores).reduce((sum, value) => sum + value, 0)),
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
