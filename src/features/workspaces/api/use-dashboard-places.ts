"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/components/auth-provider";
import { apiGet } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { PlaceRecord } from "@/features/workspaces/api/live-api";

export function useDashboardPlaces() {
	const { session } = useAuth();
	return useQuery({
		queryKey: queryKeys.dashboard.places(),
		queryFn: () => apiGet<PlaceRecord[]>("/api/dashboard/places"),
		enabled: session !== null
	});
}
