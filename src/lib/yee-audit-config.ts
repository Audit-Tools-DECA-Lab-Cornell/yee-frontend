export type YeeStepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type YeeDomainKey =
	| "access"
	| "activitySpaces"
	| "amenities"
	| "experienceOfSpace"
	| "aestheticsAndCare"
	| "useAndUsability";

export type YeeAuditDraft = {
	placeId: string;
	placeName: string;
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
	weightingComments: string;
	responses: Record<string, string | Record<string, string>>;
	comments: string;
	sectionComments: Record<YeeDomainKey, string>;
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
	selectedWeights: Record<YeeDomainKey, number>;
	normalizedWeights: Record<YeeDomainKey, number>;
	unweightedDomainAverages: Record<YeeDomainKey, number>;
	priorityGaps: Record<YeeDomainKey, number>;
	totalRawScore: number;
	totalWeightedScore: number;
	matchedScoredAnswers: number;
	categoryScores: Record<string, number>;
};

export const yeeSteps: { step: YeeStepNumber; title: string; description: string }[] = [
	{ step: 1, title: "Context and visit details", description: "" },
	{ step: 2, title: "Importance weighting", description: "" },
	{ step: 3, title: "Access", description: "" },
	{ step: 4, title: "Activity Spaces", description: "" },
	{ step: 5, title: "Amenities", description: "" },
	{ step: 6, title: "Experience of the Space", description: "" },
	{ step: 7, title: "Aesthetics and Care", description: "" },
	{ step: 8, title: "Use and Usability", description: "" },
	{ step: 9, title: "Final comments", description: "" }
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
	{ value: "never-before", label: "I have never been here before" },
	{ value: "every-or-almost-every-day", label: "Every day or Almost every day" },
	{ value: "once-or-twice-a-week", label: "One or twice a week" },
	{ value: "once-or-twice-a-month", label: "Once of twice a month" },
	{ value: "few-times-less-than-monthly", label: "Only a few times (less than once a month)" },
	{ value: "not-in-last-6-months", label: "I have not been here in the last 6 months" }
];

export const seasonOptions = [
	{ value: "spring", label: "Spring" },
	{ value: "summer", label: "Summer" },
	{ value: "autumn", label: "Autumn" },
	{ value: "winter", label: "Winter" }
];

export const weatherOptions = [
	{ value: "sunny-mostly-sunny", label: "Sunny / Mostly sunny" },
	{ value: "mostly-cloudy-overcast", label: "Mostly cloudy / Overcast" },
	{ value: "rainy-drizzling", label: "Rainy / drizzling" },
	{ value: "windy", label: "Windy" },
	{ value: "snowy-flurries", label: "Snowy / Flurries" },
	{ value: "stormy", label: "Stormy" },
	{ value: "feels-hot", label: "Feels hot / very hot" },
	{ value: "feels-cold", label: "Feels cold / very cold" }
];

export function createDefaultDraft(placeId: string): YeeAuditDraft {
	const startedAt = new Date();
	return {
		placeId,
		placeName: "",
		auditorId: "AUD000",
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
		weightingComments: "",
		responses: {},
		comments: "",
		sectionComments: {
			access: "",
			activitySpaces: "",
			amenities: "",
			experienceOfSpace: "",
			aestheticsAndCare: "",
			useAndUsability: ""
		},
		submittedAt: null,
		lastResult: null,
		scorePreview: null
	};
}

export function getDraftStorageKey(placeId: string) {
	return `yee-audit-draft:${placeId}`;
}

export function getNextStep(step: YeeStepNumber) {
	return step < 9 ? (step + 1 as YeeStepNumber) : null;
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
		case 9:
			return null;
		default:
			return null;
	}
}
