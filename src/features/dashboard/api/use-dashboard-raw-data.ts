"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/auth/auth-provider";
import { apiGet } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { RawDataRecord } from "@/lib/dashboard/live-api";

export function useDashboardRawData() {
  const { session } = useAuth();
  return useQuery({
    queryKey: queryKeys.dashboard.rawData(),
    queryFn: () => apiGet<RawDataRecord[]>("/api/dashboard/raw-data"),
    enabled: session !== null,
  });
}
