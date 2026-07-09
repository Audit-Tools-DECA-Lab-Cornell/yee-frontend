"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";
import { Toaster } from "sonner";

import { AuthProvider } from "@/features/auth/components/auth-provider";
import { AnalyticsProvider } from "@/components/providers/analytics-provider";

export interface AppProvidersProps {
	children: React.ReactNode;
}

/**
 * App-wide client providers (React Query, etc.).
 */
export function AppProviders({ children }: AppProvidersProps) {
	const [queryClient] = React.useState(() => {
		return new QueryClient({
			defaultOptions: {
				queries: {
					retry: 1,
					staleTime: 30_000,
					refetchOnWindowFocus: false
				},
				mutations: {
					retry: 0
				}
			}
		});
	});

	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<AnalyticsProvider>{children}</AnalyticsProvider>
			</AuthProvider>
			<Toaster richColors position="top-right" />
		</QueryClientProvider>
	);
}
