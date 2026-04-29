"use client";

import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { fetchMyPlaces, type AssignedPlaceRecord } from "@/lib/dashboard/live-api";
import { fetchAuditState, type YeeAuditState } from "@/lib/yee-audit-api";

type AuditorAuditData = {
	places: AssignedPlaceRecord[];
	auditStates: Record<string, YeeAuditState>;
	submittedCount: number;
	draftCount: number;
	firstDraftPlaceId: string | null;
	loading: boolean;
	error: string | null;
	refresh: () => Promise<void>;
};

export function useAuditorAuditData(): AuditorAuditData {
	const { session } = useAuth();
	const [places, setPlaces] = React.useState<AssignedPlaceRecord[]>([]);
	const [auditStates, setAuditStates] = React.useState<Record<string, YeeAuditState>>({});
	const [submittedCount, setSubmittedCount] = React.useState(0);
	const [draftCount, setDraftCount] = React.useState(0);
	const [firstDraftPlaceId, setFirstDraftPlaceId] = React.useState<string | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	const refresh = React.useCallback(async () => {
		if (!session) return;
		setError(null);
		const rows = await fetchMyPlaces(session);
		const states = await Promise.all(rows.map(place => fetchAuditState(place.id, session)));
		setPlaces(rows);
		setAuditStates(Object.fromEntries(states.map(state => [state.place_id, state])));
		setSubmittedCount(states.filter(state => state.status === "SUBMITTED").length);
		setDraftCount(states.filter(state => state.status === "DRAFT").length);
		setFirstDraftPlaceId(states.find(state => state.status === "DRAFT")?.place_id ?? null);
	}, [session]);

	React.useEffect(() => {
		if (!session) return;
		let cancelled = false;

		const run = async () => {
			setLoading(true);
			try {
				await refresh();
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "Could not load assigned places.");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		void run();

		const handleFocus = () => {
			void refresh().catch(err => {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "Could not refresh assigned places.");
				}
			});
		};

		window.addEventListener("focus", handleFocus);
		document.addEventListener("visibilitychange", handleFocus);

		return () => {
			cancelled = true;
			window.removeEventListener("focus", handleFocus);
			document.removeEventListener("visibilitychange", handleFocus);
		};
	}, [refresh, session]);

	return {
		places,
		auditStates,
		submittedCount,
		draftCount,
		firstDraftPlaceId,
		loading,
		error,
		refresh
	};
}
