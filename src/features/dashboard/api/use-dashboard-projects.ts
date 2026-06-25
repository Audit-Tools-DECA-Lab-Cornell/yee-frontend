"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/auth/auth-provider";
import { apiGet } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { ProjectRecord } from "@/lib/dashboard/live-api";

export function useDashboardProjects() {
	const { session } = useAuth();
	return useQuery({
		queryKey: queryKeys.dashboard.projects(),
		queryFn: () => apiGet<ProjectRecord[]>("/api/dashboard/projects"),
		enabled: session !== null
	});
}
