import { PLACE_HUB, PROJECT_BASELINE } from "../fixtures/ids";
import type { E2ERole } from "../fixtures/users";

type CaptureRole = E2ERole | "public";

export interface CaptureTarget {
	readonly segments: readonly string[];
	readonly role: CaptureRole;
	readonly route: string;
	readonly label: string;
	readonly readyText?: RegExp | string;
}

export const captureCatalog = [
	{
		segments: ["public", "landing"],
		role: "public",
		route: "/",
		label: "Public landing page",
		readyText: /Youth Enabling Environments/i
	},
	{ segments: ["auth", "login"], role: "public", route: "/login", label: "Login", readyText: /sign in/i },
	{
		segments: ["auth", "signup"],
		role: "public",
		route: "/signup",
		label: "Signup",
		readyText: /Create an organization account/i
	},
	{
		segments: ["auth", "forgot-password"],
		role: "public",
		route: "/forgot-password",
		label: "Forgot password",
		readyText: /reset|forgot|email/i
	},
	{
		segments: ["manager", "dashboard"],
		role: "manager",
		route: "/manager",
		label: "Manager overview",
		readyText: /Manager Overview/i
	},
	{
		segments: ["manager", "projects"],
		role: "manager",
		route: "/manager/projects",
		label: "Manager projects",
		readyText: /Youth Enabling Environments Baseline 2026/i
	},
	{
		segments: ["manager", "projects", "new"],
		role: "manager",
		route: "/manager/projects/new",
		label: "Create project",
		readyText: /Create Project/i
	},
	{
		segments: ["manager", "projects", "detail"],
		role: "manager",
		route: `/manager/projects/${PROJECT_BASELINE}`,
		label: "Project detail",
		readyText: /Youth Enabling Environments Baseline 2026/i
	},
	{
		segments: ["manager", "places"],
		role: "manager",
		route: "/manager/places",
		label: "Manager places",
		readyText: /Westside Youth Hub/i
	},
	{
		segments: ["manager", "places", "new"],
		role: "manager",
		route: `/manager/places/new?projectId=${PROJECT_BASELINE}`,
		label: "Add place",
		readyText: /Add Place/i
	},
	{
		segments: ["manager", "places", "detail"],
		role: "manager",
		route: `/manager/places/${PLACE_HUB}`,
		label: "Place detail",
		readyText: /Westside Youth Hub/i
	},
	{
		segments: ["manager", "auditors"],
		role: "manager",
		route: "/manager/auditors",
		label: "Manager auditors",
		readyText: /Assign auditors to places and projects/i
	},
	{
		segments: ["manager", "auditors", "invite"],
		role: "manager",
		route: "/manager/auditors/invite",
		label: "Invite auditor",
		readyText: /Invite an auditor/i
	},
	{
		segments: ["manager", "audits"],
		role: "manager",
		route: "/manager/audits",
		label: "Manager audits",
		readyText: /Filter by project or place, compare selected audits/i
	},
	{
		segments: ["manager", "reports"],
		role: "manager",
		route: "/manager/reports",
		label: "Manager reports",
		readyText: /Reports dashboard/i
	},
	{
		segments: ["manager", "raw-data"],
		role: "manager",
		route: "/manager/raw-data",
		label: "Manager raw data",
		readyText: /Manager Raw Data/i
	},
	{
		segments: ["manager", "settings"],
		role: "manager",
		route: "/manager/settings",
		label: "Manager settings",
		readyText: /Manager profile/i
	},
	{
		segments: ["admin", "dashboard"],
		role: "admin",
		route: "/admin",
		label: "Admin overview",
		readyText: /Admin Overview/i
	},
	{
		segments: ["admin", "users"],
		role: "admin",
		route: "/admin/users",
		label: "Admin users",
		readyText: /All managers, auditors, and admins across the system/i
	},
	{
		segments: ["admin", "projects"],
		role: "admin",
		route: "/admin/projects",
		label: "Admin projects",
		readyText: /Youth Enabling Environments Baseline 2026/i
	},
	{
		segments: ["admin", "places"],
		role: "admin",
		route: "/admin/places",
		label: "Admin places",
		readyText: /Westside Youth Hub/i
	},
	{
		segments: ["admin", "audits"],
		role: "admin",
		route: "/admin/audits",
		label: "Admin audits",
		readyText: /Filter by project or place, compare selected audits/i
	},
	{
		segments: ["admin", "raw-data"],
		role: "admin",
		route: "/admin/raw-data",
		label: "Admin raw data",
		readyText: /Admin Raw Data/i
	},
	{
		segments: ["admin", "instruments"],
		role: "admin",
		route: "/admin/instruments",
		label: "Admin instruments",
		readyText: /Instrument Management/i
	},
	{
		segments: ["admin", "content"],
		role: "admin",
		route: "/admin/content",
		label: "Admin website copy",
		readyText: /Website copy editor/i
	},
	{
		segments: ["admin", "settings"],
		role: "admin",
		route: "/admin/settings",
		label: "Admin settings",
		readyText: /Admin Settings/i
	},
	{
		segments: ["auditor", "dashboard"],
		role: "auditor",
		route: "/auditor",
		label: "Auditor overview",
		readyText: /Auditor Overview/i
	},
	{
		segments: ["auditor", "places"],
		role: "auditor",
		route: "/auditor/places",
		label: "Auditor places"
	},
	{
		segments: ["auditor", "settings"],
		role: "auditor",
		route: "/auditor/settings",
		label: "Auditor settings",
		readyText: /Personal Settings/i
	},
	{
		segments: ["yee", "introduction"],
		role: "auditor",
		route: "/yee/introduction",
		label: "YEE introduction",
		readyText: /Choose a place to evaluate/i
	}
] satisfies readonly CaptureTarget[];
