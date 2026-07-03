import { dashboardChromeStates } from "./shared";
import { openFilterDropdown } from "./steps";
import type { CaptureTarget } from "./types";

export const adminTargets: readonly CaptureTarget[] = [
	{
		segments: ["admin", "dashboard"],
		role: "admin",
		route: "/admin",
		readyText: /Admin Overview/i,
		states: [{ name: "overview", label: "Admin overview" }, ...dashboardChromeStates]
	},
	{
		segments: ["admin", "users"],
		role: "admin",
		route: "/admin/users",
		readyText: /All managers, auditors, and admins across the system/i,
		states: [{ name: "overview", label: "Admin users" }]
	},
	{
		segments: ["admin", "projects"],
		role: "admin",
		route: "/admin/projects",
		readyText: /Youth Enabling Environments Baseline 2026/i,
		states: [{ name: "overview", label: "Admin projects" }]
	},
	{
		segments: ["admin", "places"],
		role: "admin",
		route: "/admin/places",
		readyText: /Westside Youth Hub/i,
		states: [{ name: "overview", label: "Admin places" }]
	},
	{
		segments: ["admin", "audits"],
		role: "admin",
		route: "/admin/audits",
		readyText: /Filter by project or place, compare selected audits/i,
		states: [
			{ name: "overview", label: "Admin audits" },
			{
				name: "project-filter-open",
				label: "Admin audits - project filter",
				optional: true,
				setup: ({ page }) => openFilterDropdown(page, "Projects")
			}
		]
	},
	{
		segments: ["admin", "raw-data"],
		role: "admin",
		route: "/admin/raw-data",
		readyText: /Admin Raw Data/i,
		states: [
			{ name: "overview", label: "Admin raw data" },
			{
				name: "organization-filter-open",
				label: "Admin raw data - organization filter",
				optional: true,
				setup: ({ page }) => openFilterDropdown(page, "Organizations")
			}
		]
	},
	{
		segments: ["admin", "instruments"],
		role: "admin",
		route: "/admin/instruments",
		readyText: /Instrument Management/i,
		states: [{ name: "overview", label: "Admin instruments" }]
	},
	{
		segments: ["admin", "content"],
		role: "admin",
		route: "/admin/content",
		readyText: /Website copy editor/i,
		states: [{ name: "overview", label: "Admin website copy" }]
	},
	{
		segments: ["admin", "settings"],
		role: "admin",
		route: "/admin/settings",
		readyText: /Admin Settings/i,
		states: [{ name: "overview", label: "Admin settings" }]
	}
];
