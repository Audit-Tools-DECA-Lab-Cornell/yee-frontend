"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/components/auth-provider";
import { apiGet } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { ProjectRecord } from "@/features/workspaces/api/live-api";

export function useDashboardProjects() {
	const { session } = useAuth();
	return useQuery({
		queryKey: queryKeys.dashboard.projects(),
		queryFn: () => apiGet<ProjectRecord[]>("/api/dashboard/projects"),
		enabled: session !== null
	});
}
