import { AUDIT_HUB, PLACE_HUB, PROJECT_BASELINE } from "../../fixtures/ids";
import { dashboardChromeStates } from "./shared";
import { openConfirmFromButton, openFilterDropdown } from "./steps";
import type { CaptureTarget } from "./types";

export const managerTargets: readonly CaptureTarget[] = [
	{
		segments: ["manager", "dashboard"],
		role: "manager",
		route: "/manager",
		readyText: /Manager Overview/i,
		states: [{ name: "overview", label: "Manager overview" }, ...dashboardChromeStates]
	},
	{
		segments: ["manager", "projects"],
		role: "manager",
		route: "/manager/projects",
		readyText: /Youth Enabling Environments Baseline 2026/i,
		states: [{ name: "overview", label: "Manager projects" }]
	},
	{
		segments: ["manager", "projects", "new"],
		role: "manager",
		route: "/manager/projects/new",
		readyText: /Create Project/i,
		states: [{ name: "overview", label: "Create project" }]
	},
	{
		segments: ["manager", "projects", "detail"],
		role: "manager",
		route: `/manager/projects/${PROJECT_BASELINE}`,
		readyText: /Youth Enabling Environments Baseline 2026/i,
		states: [{ name: "overview", label: "Project detail" }]
	},
	{
		segments: ["manager", "projects", "edit"],
		role: "manager",
		route: `/manager/projects/${PROJECT_BASELINE}/edit`,
		readyText: /Edit Project/i,
		states: [{ name: "overview", label: "Edit project" }]
	},
	{
		segments: ["manager", "places"],
		role: "manager",
		route: "/manager/places",
		readyText: /Westside Youth Hub/i,
		states: [
			{ name: "overview", label: "Manager places" },
			{
				name: "project-filter-open",
				label: "Manager places - project filter",
				optional: true,
				setup: ({ page }) => openFilterDropdown(page, "Projects")
			}
		]
	},
	{
		segments: ["manager", "places", "new"],
		role: "manager",
		route: `/manager/places/new?projectId=${PROJECT_BASELINE}`,
		readyText: /Add Place/i,
		states: [{ name: "overview", label: "Add place" }]
	},
	{
		segments: ["manager", "places", "detail"],
		role: "manager",
		route: `/manager/places/${PLACE_HUB}`,
		readyText: /Westside Youth Hub/i,
		states: [{ name: "overview", label: "Place detail" }]
	},
	{
		segments: ["manager", "places", "edit"],
		role: "manager",
		route: `/manager/places/${PLACE_HUB}/edit`,
		readyText: /Edit Place/i,
		states: [{ name: "overview", label: "Edit place" }]
	},
	{
		segments: ["manager", "auditors"],
		role: "manager",
		route: "/manager/auditors",
		readyText: /Assign auditors to places and projects/i,
		states: [
			{ name: "overview", label: "Manager auditors" },
			{
				name: "project-filter-open",
				label: "Manager auditors - project filter",
				optional: true,
				setup: ({ page }) => openFilterDropdown(page, "Projects")
			}
		]
	},
	{
		segments: ["manager", "auditors", "invite"],
		role: "manager",
		route: "/manager/auditors/invite",
		readyText: /Invite an auditor/i,
		states: [{ name: "overview", label: "Invite auditor" }]
	},
	{
		segments: ["manager", "managers", "invite"],
		role: "manager",
		route: "/manager/managers/invite",
		readyText: /Invite a manager/i,
		states: [{ name: "overview", label: "Invite manager" }]
	},
	{
		segments: ["manager", "audits"],
		role: "manager",
		route: "/manager/audits",
		readyText: /Filter by project or place, compare selected audits/i,
		states: [
			{ name: "overview", label: "Manager audits" },
			{
				name: "project-filter-open",
				label: "Manager audits - project filter",
				optional: true,
				setup: ({ page }) => openFilterDropdown(page, "Projects")
			}
		]
	},
	{
		segments: ["manager", "audits", "edit"],
		role: "manager",
		route: `/manager/audits/${AUDIT_HUB}/edit/page/1`,
		readyText: /Context and visit details/i,
		states: [{ name: "overview", label: "Manager audit edit" }]
	},
	{
		segments: ["manager", "audits", "edit", "review"],
		role: "manager",
		route: `/manager/audits/${AUDIT_HUB}/edit/review`,
		readyText: /Review and submit/i,
		states: [{ name: "overview", label: "Manager audit edit review" }]
	},
	{
		segments: ["manager", "reports"],
		role: "manager",
		route: "/manager/reports",
		readyText: /Reports dashboard/i,
		states: [
			{ name: "overview", label: "Manager reports" },
			{
				name: "project-filter-open",
				label: "Manager reports - project filter",
				optional: true,
				setup: ({ page }) => openFilterDropdown(page, "Projects")
			}
		]
	},
	{
		segments: ["manager", "raw-data"],
		role: "manager",
		route: "/manager/raw-data",
		readyText: /Manager Raw Data/i,
		states: [
			{ name: "overview", label: "Manager raw data" },
			{
				name: "project-filter-open",
				label: "Manager raw data - project filter",
				optional: true,
				setup: ({ page }) => openFilterDropdown(page, "Projects")
			}
		]
	},
	{
		segments: ["manager", "settings"],
		role: "manager",
		route: "/manager/settings",
		readyText: /Manager profile/i,
		states: [
			{ name: "overview", label: "Manager settings" },
			{
				name: "remove-manager-confirm-open",
				label: "Manager settings - remove manager confirmation",
				optional: true,
				setup: ({ page }) => openConfirmFromButton(page, /Remove manager/i)
			}
		]
	}
];
