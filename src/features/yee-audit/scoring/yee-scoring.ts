import {
	yeeDomainLabels,
	type YeeAuditDraft,
	type YeeDomainKey,
	type YeeScoreResult
} from "@/features/yee-audit/config/yee-audit-config";

/**
 * Request a score preview for the in-progress draft. Scoring is owned entirely
 * by the backend: this returns the canonical {@link YeeScoreResult} unchanged.
 * The browser performs no weighting, normalization, or limit math of its own.
 */
export async function fetchScorePreview(
	placeId: string,
	participantInfo: Record<string, unknown>,
	responses: YeeAuditDraft["responses"]
): Promise<YeeScoreResult> {
	const response = await fetch("/api/yee/audits/score", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ place_id: placeId, participant_info: participantInfo, responses })
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Score preview failed (${response.status}): ${body}`);
	}

	return (await response.json()) as YeeScoreResult;
}

/**
 * Display-only helper: flatten the canonical score into per-domain rows for the
 * score table. No math beyond selecting backend-provided values by domain.
 */
export function getScoreRows(score: YeeScoreResult) {
	// The per-domain score maps can be absent at runtime during the backend
	// scoring rollout. Guard every access — indexing an undefined map by the
	// first domain key ("access") is what previously crashed the report viewer
	// and the wizard review step with "reading 'access'".
	return (Object.keys(yeeDomainLabels) as YeeDomainKey[]).map(domain => ({
		domain,
		label: yeeDomainLabels[domain],
		rawScore: score.raw_domain_scores?.[domain] ?? 0,
		rawMaximum: score.raw_domain_maximums?.[domain] ?? 0,
		weightedScore: score.weighted_domain_scores?.[domain] ?? 0,
		weightedMaximum: score.weighted_domain_maximums?.[domain] ?? 0
	}));
}
