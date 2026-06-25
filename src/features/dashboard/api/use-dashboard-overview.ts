"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/auth/auth-provider";
import { apiGet } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { DashboardOverview } from "@/lib/dashboard/live-api";

export function useDashboardOverview() {
	const { session } = useAuth();
	return useQuery({
		queryKey: queryKeys.dashboard.overview(),
		queryFn: () => apiGet<DashboardOverview>("/api/dashboard/overview"),
		enabled: session !== null
	});
}
