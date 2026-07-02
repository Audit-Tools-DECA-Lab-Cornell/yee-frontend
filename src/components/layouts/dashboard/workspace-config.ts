import {
	BarChart3,
	ClipboardList,
	Database,
	FileText,
	FilePlus2,
	FolderKanban,
	LayoutDashboard,
	MapPinned,
	Settings2,
	Users2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type WorkspaceVariant = "admin" | "manager" | "auditor";

export type WorkspaceNavItem = {
	label: string;
	href: string;
	icon: LucideIcon;
};

export type WorkspaceConfig = {
	variant: WorkspaceVariant;
	badge: string;
	title: string;
	description: string;
	searchPlaceholder: string;
	primaryAction: {
		label: string;
		href: string;
		icon: LucideIcon;
	};
	sidebarCard: {
		eyebrow: string;
		title: string;
		description: string;
		actionLabel: string;
		actionHref: string;
		actionIcon: LucideIcon;
	};
	navigation: WorkspaceNavItem[];
	secondaryNavigation: WorkspaceNavItem[];
	pageCopy: Record<string, { title: string; description: string }>;
};

export type SiteCopyPayload = {
	workspaceConfigs?: Partial<
		Record<
			WorkspaceVariant,
			{
				description?: string;
				searchPlaceholder?: string;
				primaryAction?: {
					label?: string;
				};
				sidebarCard?: {
					eyebrow?: string;
					title?: string;
					description?: string;
					actionLabel?: string;
				};
				pageCopy?: Record<
					string,
					{
						title?: string;
						description?: string;
					}
				>;
			}
		>
	>;
};

export const defaultWorkspaceConfigs: Record<WorkspaceVariant, WorkspaceConfig> = {
	admin: {
		variant: "admin",
		badge: "Admin view",
		title: "System administration for the full audit platform.",
		description: "Monitor all users, projects, places, and audits across organizations from one control surface.",
		searchPlaceholder: "Search users, projects, organizations, or audits...",
		primaryAction: {
			label: "Add User",
			href: "/admin/users",
			icon: Users2
		},
		sidebarCard: {
			eyebrow: "Admin tools",
			title: "Review all accounts",
			description: "Jump into user management, permissions, and platform-wide audit oversight.",
			actionLabel: "Open Users",
			actionHref: "/admin/users",
			actionIcon: Users2
		},
		navigation: [
			{ label: "Overview", href: "/admin", icon: LayoutDashboard },
			{ label: "Users", href: "/admin/users", icon: Users2 },
			{ label: "Website Copy", href: "/admin/content", icon: FileText },
			{ label: "Instruments", href: "/admin/instruments", icon: FileText },
			{ label: "Projects", href: "/admin/projects", icon: FolderKanban },
			{ label: "Places", href: "/admin/places", icon: MapPinned },
			{ label: "Audits", href: "/admin/audits", icon: ClipboardList },
			{ label: "Raw Data", href: "/admin/raw-data", icon: Database }
		],
		secondaryNavigation: [{ label: "Settings", href: "/admin/settings", icon: Settings2 }],
		pageCopy: {
			"/admin": {
				title: "Admin Overview",
				description: "Master dashboard for users, organizations, projects, places, and audits."
			},
			"/admin/users": {
				title: "Users",
				description: "View managers, auditors, account states, and role assignments."
			},
			"/admin/content": {
				title: "Website Copy",
				description:
					"Edit dashboard wording across the admin, manager, and auditor website without touching code."
			},
			"/admin/instruments": {
				title: "Instruments",
				description: "Manage versioned YEE survey instruments and activate the one used by the website."
			},
			"/admin/projects": {
				title: "Projects",
				description: "Audit project activity across the entire platform."
			},
			"/admin/places": {
				title: "Places",
				description: "Monitor place coverage and review fieldwork readiness at scale."
			},
			"/admin/audits": {
				title: "Audits",
				description: "See submissions across all teams and organizations."
			},
			"/admin/raw-data": {
				title: "Raw Data",
				description: "Export system-wide audit records and future comparative datasets."
			},
			"/admin/settings": {
				title: "Settings",
				description: "Placeholder for system-wide configuration, exports, and admin tools."
			}
		}
	},
	manager: {
		variant: "manager",
		badge: "Manager view",
		title: "Coordinate projects, places, auditors, and audit results.",
		description:
			"Use this workspace to create studies, set up field locations, invite auditors, and track progress.",
		searchPlaceholder: "Search projects, places, auditors, or audits...",
		primaryAction: {
			label: "Create Project",
			href: "/manager/projects/new",
			icon: FilePlus2
		},
		sidebarCard: {
			eyebrow: "Quick start",
			title: "Launch manager actions",
			description: "Create a Project, add a Place, or invite an auditor.",
			actionLabel: "Create Project",
			actionHref: "/manager/projects/new",
			actionIcon: FilePlus2
		},
		navigation: [
			{ label: "Overview", href: "/manager", icon: LayoutDashboard },
			{ label: "Projects", href: "/manager/projects", icon: FolderKanban },
			{ label: "Places", href: "/manager/places", icon: MapPinned },
			{ label: "Auditors", href: "/manager/auditors", icon: Users2 },
			{ label: "Audits", href: "/manager/audits", icon: ClipboardList },
			{ label: "Reports", href: "/manager/reports", icon: BarChart3 },
			{ label: "Raw Data", href: "/manager/raw-data", icon: Database }
		],
		secondaryNavigation: [{ label: "Settings", href: "/manager/settings", icon: Settings2 }],
		pageCopy: {
			"/manager": {
				title: "Manager Overview",
				description: "Manage projects, places, auditors, and completed audits from one workspace."
			},
			"/manager/projects": {
				title: "Projects",
				description: "Review and create studies, then drill into place and audit coverage."
			},
			"/manager/projects/new": {
				title: "Create Project",
				description: "Set up a new project and prepare it for places, auditors, and reporting."
			},
			"/manager/places": {
				title: "Places",
				description: "Track place readiness, assignment, and audit activity."
			},
			"/manager/places/new": {
				title: "Add Place",
				description: "Add a new field site and connect it to a project."
			},
			"/manager/auditors": {
				title: "Auditors",
				description: "Invite auditors, review assignment coverage, and monitor status."
			},
			"/manager/audits": {
				title: "Audits",
				description: "Review submissions, compare results, and launch new audits."
			},
			"/manager/reports": {
				title: "Reports",
				description: "Track score summaries and compare project-level performance."
			},
			"/manager/raw-data": {
				title: "Raw Data",
				description: "Export manager-scoped audits, answers, and future score summaries."
			},
			"/manager/settings": {
				title: "Settings",
				description: "Placeholder for account, notification, and project-scoped settings."
			}
		}
	},
	auditor: {
		variant: "auditor",
		badge: "Auditor view",
		title: "Focus on assigned places and complete fieldwork.",
		description:
			"Auditors see only their own places, active audits, and personal history rather than management tools.",
		searchPlaceholder: "Search your places or saved audits...",
		primaryAction: {
			label: "Start Audit",
			href: "/yee/introduction",
			icon: FilePlus2
		},
		sidebarCard: {
			eyebrow: "Fieldwork",
			title: "Continue assigned work",
			description: "Jump into your next place visit or resume a saved audit from the dashboard.",
			actionLabel: "Start Audit",
			actionHref: "/yee/introduction",
			actionIcon: FilePlus2
		},
		navigation: [
			{ label: "Overview", href: "/auditor", icon: LayoutDashboard },
			{ label: "My Audits", href: "/auditor/places", icon: ClipboardList }
		],
		secondaryNavigation: [{ label: "Settings", href: "/auditor/settings", icon: Settings2 }],
		pageCopy: {
			"/auditor": {
				title: "Auditor Overview",
				description: "Review assigned places, continue fieldwork, and track your own submission history."
			},
			"/auditor/places": {
				title: "My Audits",
				description: "Review audit status and place-by-place actions for the locations assigned to you."
			},
			"/auditor/settings": {
				title: "Settings",
				description: "Placeholder for personal profile and preferences."
			}
		}
	}
};

export function buildWorkspaceConfigs(overrides?: SiteCopyPayload | null): Record<WorkspaceVariant, WorkspaceConfig> {
	if (!overrides?.workspaceConfigs) {
		return defaultWorkspaceConfigs;
	}

	return (Object.keys(defaultWorkspaceConfigs) as WorkspaceVariant[]).reduce(
		(accumulator, variant) => {
			const base = defaultWorkspaceConfigs[variant];
			const override = overrides.workspaceConfigs?.[variant];

			if (!override) {
				accumulator[variant] = base;
				return accumulator;
			}

			const mergedPageCopy = Object.fromEntries(
				Object.entries(base.pageCopy).map(([path, content]) => [
					path,
					{
						title: override.pageCopy?.[path]?.title ?? content.title,
						description: override.pageCopy?.[path]?.description ?? content.description
					}
				])
			);

			accumulator[variant] = {
				...base,
				description: override.description ?? base.description,
				searchPlaceholder: override.searchPlaceholder ?? base.searchPlaceholder,
				primaryAction: {
					...base.primaryAction,
					label: override.primaryAction?.label ?? base.primaryAction.label
				},
				sidebarCard: {
					...base.sidebarCard,
					eyebrow: override.sidebarCard?.eyebrow ?? base.sidebarCard.eyebrow,
					title: override.sidebarCard?.title ?? base.sidebarCard.title,
					description: override.sidebarCard?.description ?? base.sidebarCard.description,
					actionLabel: override.sidebarCard?.actionLabel ?? base.sidebarCard.actionLabel
				},
				pageCopy: mergedPageCopy
			};

			return accumulator;
		},
		{} as Record<WorkspaceVariant, WorkspaceConfig>
	);
}

export const workspaceConfigs = defaultWorkspaceConfigs;
