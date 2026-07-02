"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/components/auth-provider";
import { apiGet } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { AuditRecord } from "@/features/workspaces/api/live-api";

export function useDashboardAudits() {
	const { session } = useAuth();
	return useQuery({
		queryKey: queryKeys.dashboard.audits(),
		queryFn: () => apiGet<AuditRecord[]>("/api/dashboard/audits"),
		enabled: session !== null
	});
}
