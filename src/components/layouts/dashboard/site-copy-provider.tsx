"use client";

import * as React from "react";

import {
	buildWorkspaceConfigs,
	defaultWorkspaceConfigs,
	type SiteCopyPayload,
	type WorkspaceConfig,
	type WorkspaceVariant
} from "@/components/layouts/dashboard/workspace-config";

const SiteCopyContext = React.createContext<{
	siteCopy: SiteCopyPayload | null;
	workspaceConfigs: Record<WorkspaceVariant, WorkspaceConfig>;
}>({
	siteCopy: null,
	workspaceConfigs: defaultWorkspaceConfigs
});

export function SiteCopyProvider({ children }: { children: React.ReactNode }) {
	const [siteCopy, setSiteCopy] = React.useState<SiteCopyPayload | null>(null);

	React.useEffect(() => {
		let cancelled = false;

		async function loadSiteCopy() {
			try {
				const response = await fetch("/api/site-copy", { cache: "no-store" });
				if (!response.ok) return;
				const data = (await response.json()) as SiteCopyPayload;
				if (!cancelled) {
					setSiteCopy(data);
				}
			} catch {
				// Fall back to baked-in copy when the admin override store is unavailable.
			}
		}

		void loadSiteCopy();
		return () => {
			cancelled = true;
		};
	}, []);

	const value = React.useMemo(
		() => ({
			siteCopy,
			workspaceConfigs: buildWorkspaceConfigs(siteCopy)
		}),
		[siteCopy]
	);

	return <SiteCopyContext.Provider value={value}>{children}</SiteCopyContext.Provider>;
}

export function useWorkspaceConfig(variant: WorkspaceVariant) {
	const { workspaceConfigs } = React.useContext(SiteCopyContext);
	return workspaceConfigs[variant];
}

export function useSiteCopy() {
	return React.useContext(SiteCopyContext);
}
