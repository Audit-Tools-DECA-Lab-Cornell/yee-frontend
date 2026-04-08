export type YeeStepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type YeeDomainKey =
	| "access"
	| "activitySpaces"
	| "amenities"
	| "experienceOfSpace"
	| "aestheticsAndCare"
	| "useAndUsability";

export type YeeAuditDraft = {
	placeId: string;
	auditorId: string;
	auditorName: string;
	auditDate: string;
	startTime: string;
	finishTime: string;
	totalMinutes: number;
	visitFrequency: string;
	season: string;
	weather: string;
	weights: Record<YeeDomainKey, string>;
	responses: Record<string, string | Record<string, string>>;
	comments: string;
	submittedAt: string | null;
	lastResult: {
		id: string;
		totalScore: number;
	} | null;
	scorePreview: YeeScorePreview | null;
};

export type YeeScorePreview = {
	rawDomainScores: Record<YeeDomainKey, number>;
	weightedDomainScores: Record<YeeDomainKey, number>;
	totalRawScore: number;
	totalWeightedScore: number;
	matchedScoredAnswers: number;
	categoryScores: Record<string, number>;
};

export const yeeSteps: { step: YeeStepNumber; title: string; description: string }[] = [
	{ step: 1, title: "Context and metadata", description: "Capture visit details before domain questions begin." },
	{ step: 2, title: "Importance weighting", description: "Collect youth importance ratings for the six YEE domains." },
	{ step: 3, title: "Access", description: "Access questions only." },
	{ step: 4, title: "Activity Spaces", description: "Activity Spaces questions only." },
	{ step: 5, title: "Amenities", description: "Amenities questions only." },
	{ step: 6, title: "Experience of the Space", description: "Experience questions only." },
	{ step: 7, title: "Aesthetics & Care", description: "Aesthetics and Care questions only." },
	{ step: 8, title: "Use & Usability", description: "Use and Usability questions plus final comments." }
];

export const yeeDomainLabels: Record<YeeDomainKey, string> = {
	access: "Access",
	activitySpaces: "Activity Spaces",
	amenities: "Amenities",
	experienceOfSpace: "Experience of the Space",
	aestheticsAndCare: "Aesthetics & Care",
	useAndUsability: "Use & Usability"
};

export const yeeWeightOptions = [
	{ value: "3", label: "Very important to me" },
	{ value: "2", label: "Somewhat important to me" },
	{ value: "1", label: "Not really important to me" }
];

export const visitFrequencyOptions = [
	{ value: "every-or-almost-every-day", label: "Every or almost every day" },
	{ value: "once-or-twice-a-week", label: "Once or twice a week" },
	{ value: "once-or-twice-a-month", label: "Once or twice a month" },
	{ value: "few-times-less-than-monthly", label: "Only a few times (less than once a month)" },
	{ value: "not-in-last-6-months", label: "I have not been here in the last 6 months" }
];

export const seasonOptions = [
	{ value: "spring", label: "Spring" },
	{ value: "summer", label: "Summer" },
	{ value: "fall", label: "Fall" },
	{ value: "winter", label: "Winter" }
];

export const weatherOptions = [
	{ value: "sunny", label: "Sunny" },
	{ value: "cloudy", label: "Cloudy" },
	{ value: "rainy", label: "Rainy" },
	{ value: "snowy", label: "Snowy" },
	{ value: "windy", label: "Windy" },
	{ value: "hot-humid", label: "Hot / Humid" }
];

export function createDefaultDraft(placeId: string): YeeAuditDraft {
	const startedAt = new Date();
	return {
		placeId,
		auditorId: `AUD-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
		auditorName: "",
		auditDate: startedAt.toISOString().slice(0, 10),
		startTime: startedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
		finishTime: "",
		totalMinutes: 0,
		visitFrequency: "",
		season: "",
		weather: "",
		weights: {
			access: "",
			activitySpaces: "",
			amenities: "",
			experienceOfSpace: "",
			aestheticsAndCare: "",
			useAndUsability: ""
		},
		responses: {},
		comments: "",
		submittedAt: null,
		lastResult: null,
		scorePreview: null
	};
}

export function getDraftStorageKey(placeId: string) {
	return `yee-audit-draft:${placeId}`;
}

export function getNextStep(step: YeeStepNumber) {
	return step < 8 ? (step + 1 as YeeStepNumber) : null;
}

export function getPreviousStep(step: YeeStepNumber) {
	return step > 1 ? (step - 1 as YeeStepNumber) : null;
}

export function getDomainForStep(step: YeeStepNumber): YeeDomainKey | null {
	switch (step) {
		case 3:
			return "access";
		case 4:
			return "activitySpaces";
		case 5:
			return "amenities";
		case 6:
			return "experienceOfSpace";
		case 7:
			return "aestheticsAndCare";
		case 8:
			return "useAndUsability";
		default:
			return null;
	}
}
