import { AUDIT_HUB, PLACE_HUB } from "../../fixtures/ids";
import type { CaptureTarget } from "./types";

const auditSteps = [
	{ step: 1, readyText: /Context and visit details/i, label: "YEE audit step 1 - visit details" },
	{ step: 2, readyText: /Youth-Weighted Importance/i, label: "YEE audit step 2 - importance" },
	{ step: 3, readyText: /Access/i, label: "YEE audit step 3 - access" },
	{ step: 4, readyText: /Activity Spaces/i, label: "YEE audit step 4 - activity spaces" },
	{ step: 5, readyText: /Amenities/i, label: "YEE audit step 5 - amenities" },
	{ step: 6, readyText: /Experience of the Space/i, label: "YEE audit step 6 - experience" },
	{ step: 7, readyText: /Aesthetics and Care/i, label: "YEE audit step 7 - aesthetics" },
	{ step: 8, readyText: /Use and Usability/i, label: "YEE audit step 8 - usability" },
	{ step: 9, readyText: /Final comments/i, label: "YEE audit step 9 - final comments" }
] as const;

export const yeeTargets: readonly CaptureTarget[] = [
	{
		segments: ["yee", "introduction"],
		role: "auditor",
		route: "/yee/introduction",
		readyText: /Choose a place to evaluate/i,
		states: [{ name: "overview", label: "YEE introduction" }]
	},
	...auditSteps.map(({ step, readyText, label }) => ({
		segments: ["yee", "audit", `page-${step}`],
		role: "auditor" as const,
		route: `/yee/audit/${PLACE_HUB}/page/${step}`,
		readyText,
		states: [{ name: "overview", label }]
	})),
	{
		segments: ["yee", "audit", "review"],
		role: "auditor",
		route: `/yee/audit/${PLACE_HUB}/review`,
		readyText: /Review and submit/i,
		states: [{ name: "overview", label: "YEE audit review" }]
	},
	{
		segments: ["yee", "audit", "submitted"],
		role: "auditor",
		route: `/yee/audit/${PLACE_HUB}/submitted`,
		readyText: /Audit submitted/i,
		states: [{ name: "overview", label: "YEE audit submitted" }]
	},
	{
		segments: ["yee", "submissions", "detail"],
		role: "auditor",
		route: `/yee/submissions/${AUDIT_HUB}`,
		readyText: /Submitted report/i,
		states: [{ name: "overview", label: "YEE submission report" }]
	}
];
