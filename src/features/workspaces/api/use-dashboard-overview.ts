"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/components/auth-provider";
import { apiGet } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { DashboardOverview } from "@/features/workspaces/api/live-api";

export function useDashboardOverview() {
	const { session } = useAuth();
	return useQuery({
		queryKey: queryKeys.dashboard.overview(),
		queryFn: () => apiGet<DashboardOverview>("/api/dashboard/overview"),
		enabled: session !== null
	});
}
