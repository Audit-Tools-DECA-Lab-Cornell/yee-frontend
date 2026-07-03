import { dashboardChromeStates } from "./shared";
import { openFilterDropdown } from "./steps";
import type { CaptureTarget } from "./types";

export const auditorTargets: readonly CaptureTarget[] = [
	{
		segments: ["auditor", "dashboard"],
		role: "auditor",
		route: "/auditor",
		readyText: /Auditor Overview/i,
		states: [{ name: "overview", label: "Auditor overview" }, ...dashboardChromeStates]
	},
	{
		segments: ["auditor", "places"],
		role: "auditor",
		route: "/auditor/places",
		readyText: /My Audits/i,
		states: [
			{ name: "overview", label: "Auditor places" },
			{
				name: "project-filter-open",
				label: "Auditor places - project filter",
				optional: true,
				setup: ({ page }) => openFilterDropdown(page, "Projects")
			}
		]
	},
	{
		segments: ["auditor", "settings"],
		role: "auditor",
		route: "/auditor/settings",
		readyText: /Personal Settings/i,
		states: [{ name: "overview", label: "Auditor settings" }]
	}
];
