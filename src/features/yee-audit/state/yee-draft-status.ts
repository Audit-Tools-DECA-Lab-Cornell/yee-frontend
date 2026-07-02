"use client";

import { getDraftStorageKey } from "@/features/yee-audit/config/yee-audit-config";

export type AuditPlaceStatus = {
	placeId: string;
	hasDraft: boolean;
	isSubmitted: boolean;
	submittedAt: string | null;
	lastResultScore: number | null;
};

export function readAuditPlaceStatus(placeId: string): AuditPlaceStatus {
	if (typeof window === "undefined") {
		return { placeId, hasDraft: false, isSubmitted: false, submittedAt: null, lastResultScore: null };
	}

	const raw = window.localStorage.getItem(getDraftStorageKey(placeId));
	if (!raw) {
		return { placeId, hasDraft: false, isSubmitted: false, submittedAt: null, lastResultScore: null };
	}

	try {
		const parsed = JSON.parse(raw) as {
			submittedAt?: string | null;
			lastResult?: { totalScore?: number } | null;
		};
		return {
			placeId,
			hasDraft: true,
			isSubmitted: Boolean(parsed.submittedAt),
			submittedAt: parsed.submittedAt ?? null,
			lastResultScore: parsed.lastResult?.totalScore ?? null
		};
	} catch {
		return { placeId, hasDraft: false, isSubmitted: false, submittedAt: null, lastResultScore: null };
	}
}
