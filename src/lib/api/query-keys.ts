/** Stable, serialisable React Query key factories for all dashboard entities. */

export const queryKeys = {
	dashboard: {
		overview: () => ["dashboard", "overview"] as const,
		places: () => ["dashboard", "places"] as const,
		auditors: () => ["dashboard", "auditors"] as const,
		audits: () => ["dashboard", "audits"] as const,
		projects: () => ["dashboard", "projects"] as const,
		rawData: () => ["dashboard", "raw-data"] as const,
		comparisons: () => ["dashboard", "comparisons"] as const,
		users: () => ["dashboard", "users"] as const,
		myPlaces: () => ["dashboard", "my-places"] as const,
		managerProfile: () => ["dashboard", "manager-profile"] as const,
		managers: () => ["dashboard", "managers"] as const,
		managerInvites: () => ["dashboard", "manager-invites"] as const,
		projectDetail: (projectId: string) => ["dashboard", "projects", projectId] as const,
		placeDetail: (placeId: string) => ["dashboard", "places", placeId] as const
	},
	admin: {
		instruments: (key?: string) => ["admin", "instruments", key ?? "yee"] as const,
		siteCopy: () => ["admin", "site-copy"] as const
	},
	auth: {
		session: () => ["auth", "session"] as const
	}
};
