"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/auth/auth-provider";
import { apiGet } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { AuditRecord } from "@/lib/dashboard/live-api";

export function useDashboardAudits() {
  const { session } = useAuth();
  return useQuery({
    queryKey: queryKeys.dashboard.audits(),
    queryFn: () => apiGet<AuditRecord[]>("/api/dashboard/audits"),
    enabled: session !== null,
  });
}
