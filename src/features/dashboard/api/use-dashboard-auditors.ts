"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/auth/auth-provider";
import { apiGet } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { AuditorRecord } from "@/lib/dashboard/live-api";

export function useDashboardAuditors() {
  const { session } = useAuth();
  return useQuery({
    queryKey: queryKeys.dashboard.auditors(),
    queryFn: () => apiGet<AuditorRecord[]>("/api/dashboard/auditors"),
    enabled: session !== null,
  });
}
