export type DashboardMetric = {
	title: string;
	value: string;
	description: string;
	trend: string;
};

export type ProjectRecord = {
	id: string;
	name: string;
	places: number;
	audits: number;
	status: string;
	lead: string;
};

export type PlaceRecord = {
	id: string;
	name: string;
	project: string;
	audits: number;
	lastAudit: string;
	status: string;
};

export type AuditRecord = {
	id: string;
	place: string;
	auditor: string;
	date: string;
	score: number;
	status: string;
};

export const dashboardMetrics: DashboardMetric[] = [
	{
		title: "Projects",
		value: "03",
		description: "Active studies currently being tracked.",
		trend: "+1 this month"
	},
	{
		title: "Places",
		value: "12",
		description: "Locations added across all projects.",
		trend: "+3 this week"
	},
	{
		title: "Auditors",
		value: "25",
		description: "Researchers currently assigned to fieldwork.",
		trend: "4 online now"
	},
	{
		title: "Completed Audits",
		value: "48",
		description: "Submissions ready for review and scoring.",
		trend: "92% completion rate"
	}
];

export const recentActivity = [
	"Central Park Playground was added to Healthy Streets.",
	"YEE audit submitted by A. Safdariyan for Riverside Plaza.",
	"Three new places were assigned to the Urban Futures project."
];

export const projects: ProjectRecord[] = [
	{
		id: "proj-healthy-streets",
		name: "Healthy Streets",
		places: 4,
		audits: 16,
		status: "Active",
		lead: "Dr. Reyes"
	},
	{
		id: "proj-urban-futures",
		name: "Urban Futures",
		places: 5,
		audits: 21,
		status: "Active",
		lead: "Dr. Campbell"
	},
	{
		id: "proj-safe-routes",
		name: "Safe Routes",
		places: 3,
		audits: 11,
		status: "Planning",
		lead: "Dr. Ahmed"
	}
];

export const places: PlaceRecord[] = [
	{
		id: "place-central-park",
		name: "Central Park Playground",
		project: "Healthy Streets",
		audits: 5,
		lastAudit: "Mar 14, 2026",
		status: "Needs review"
	},
	{
		id: "place-riverside",
		name: "Riverside Plaza",
		project: "Urban Futures",
		audits: 4,
		lastAudit: "Mar 16, 2026",
		status: "Up to date"
	},
	{
		id: "place-maple",
		name: "Maple Youth Center",
		project: "Safe Routes",
		audits: 2,
		lastAudit: "Mar 10, 2026",
		status: "Scheduled"
	},
	{
		id: "place-harbor",
		name: "Harbor Walk",
		project: "Urban Futures",
		audits: 6,
		lastAudit: "Mar 12, 2026",
		status: "Up to date"
	}
];

export const audits: AuditRecord[] = [
	{
		id: "audit-001",
		place: "Central Park Playground",
		auditor: "Andisha Safdariyan",
		date: "Mar 16, 2026",
		score: 82,
		status: "Scored"
	},
	{
		id: "audit-002",
		place: "Riverside Plaza",
		auditor: "J. Patel",
		date: "Mar 14, 2026",
		score: 76,
		status: "Scored"
	},
	{
		id: "audit-003",
		place: "Harbor Walk",
		auditor: "M. Lewis",
		date: "Mar 12, 2026",
		score: 88,
		status: "Validated"
	},
	{
		id: "audit-004",
		place: "Maple Youth Center",
		auditor: "K. Brooks",
		date: "Mar 10, 2026",
		score: 0,
		status: "Draft"
	}
];
