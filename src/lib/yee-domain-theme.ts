import type { YeeDomainKey, YeeStepNumber } from "@/lib/yee-audit-config";

type DomainTheme = {
	label: string;
	step: YeeStepNumber;
	lightHex: string;
	strongHex: string;
	strongFillHex: string;
	active: string;
	idle: string;
	card: string;
	inner: string;
	selected: string;
	instruction: string;
	progress: string;
	condition: string;
	fillClass: string;
	borderClass: string;
	textClass: string;
};

export const yeeDomainThemes: Record<YeeDomainKey, DomainTheme> = {
	access: {
		label: "Access",
		step: 3,
		lightHex: "#dcefe0",
		strongHex: "#5c8f68",
		strongFillHex: "#7fb58b",
		active: "border-emerald-400 bg-gradient-to-br from-[#f5fbf6] via-[#edf7ef] to-[#dcefe0] text-emerald-950 ring-2 ring-emerald-200 shadow-[0_16px_32px_-24px_rgba(72,117,83,0.34)]",
		idle: "border-emerald-200 bg-[#f5fbf6] text-emerald-950 hover:border-emerald-300 hover:bg-[#eaf6ed]",
		card: "border-emerald-200/80 bg-[#f2f8f3]",
		inner: "border-emerald-100 bg-white/92",
		selected:
			"border-emerald-600 bg-[#dcefe0] text-emerald-950 ring-1 ring-emerald-300 shadow-[0_10px_22px_-18px_rgba(72,117,83,0.34)]",
		instruction: "border-[#9fd0a8] bg-[#73ae80] text-white",
		progress: "border-emerald-200/80 bg-[#f3faf5]",
		condition: "border-emerald-300 bg-[#e6f4e9]",
		fillClass: "bg-emerald-500",
		borderClass: "border-emerald-300",
		textClass: "text-emerald-900"
	},
	activitySpaces: {
		label: "Activity Spaces",
		step: 4,
		lightHex: "#dfe8ff",
		strongHex: "#6d8fe0",
		strongFillHex: "#95aff5",
		active: "border-blue-400 bg-gradient-to-br from-[#f7f9ff] via-[#eef3ff] to-[#dfe8ff] text-blue-950 ring-2 ring-blue-200 shadow-[0_16px_32px_-24px_rgba(80,104,180,0.34)]",
		idle: "border-blue-200 bg-[#f5f8ff] text-blue-950 hover:border-blue-300 hover:bg-[#eaf0ff]",
		card: "border-blue-200/80 bg-[#f4f7ff]",
		inner: "border-blue-100 bg-white/92",
		selected:
			"border-blue-600 bg-[#dfe8ff] text-blue-950 ring-1 ring-blue-300 shadow-[0_10px_22px_-18px_rgba(80,104,180,0.34)]",
		instruction: "border-[#bdd0ff] bg-[#89a7f0] text-white",
		progress: "border-blue-200/80 bg-[#f3f6ff]",
		condition: "border-blue-300 bg-[#e9efff]",
		fillClass: "bg-blue-500",
		borderClass: "border-blue-300",
		textClass: "text-blue-900"
	},
	amenities: {
		label: "Amenities",
		step: 5,
		lightHex: "#fef3c7",
		strongHex: "#d6a43b",
		strongFillHex: "#e8be63",
		active: "border-amber-400 bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 text-amber-950 ring-2 ring-amber-200 shadow-[0_16px_32px_-24px_rgba(180,83,9,0.32)]",
		idle: "border-amber-200 bg-amber-50/80 text-amber-900 hover:border-amber-300 hover:bg-amber-100/80",
		card: "border-amber-200/80 bg-[#fff8ee]",
		inner: "border-amber-100 bg-white/92",
		selected:
			"border-amber-600 bg-amber-200 text-amber-950 ring-1 ring-amber-300 shadow-[0_10px_22px_-18px_rgba(180,83,9,0.3)]",
		instruction: "border-[#ffd27a] bg-[#e5ae47] text-white",
		progress: "border-amber-200/80 bg-amber-50/80",
		condition: "border-amber-300 bg-amber-100/80",
		fillClass: "bg-amber-500",
		borderClass: "border-amber-300",
		textClass: "text-amber-900"
	},
	experienceOfSpace: {
		label: "Experience of the Space",
		step: 6,
		lightHex: "#ccfbf1",
		strongHex: "#4db5aa",
		strongFillHex: "#67cdc0",
		active: "border-teal-400 bg-gradient-to-br from-teal-50 via-teal-100 to-teal-200 text-teal-950 ring-2 ring-teal-200 shadow-[0_16px_32px_-24px_rgba(17,94,89,0.34)]",
		idle: "border-teal-200 bg-teal-50/80 text-teal-900 hover:border-teal-300 hover:bg-teal-100/80",
		card: "border-teal-200/80 bg-[#eef9f7]",
		inner: "border-teal-100 bg-white/92",
		selected:
			"border-teal-600 bg-teal-200 text-teal-950 ring-1 ring-teal-300 shadow-[0_10px_22px_-18px_rgba(17,94,89,0.32)]",
		instruction: "border-[#7edfd8] bg-[#58bbb2] text-white",
		progress: "border-teal-200/80 bg-teal-50/80",
		condition: "border-teal-300 bg-teal-100/85",
		fillClass: "bg-teal-500",
		borderClass: "border-teal-300",
		textClass: "text-teal-900"
	},
	aestheticsAndCare: {
		label: "Aesthetics & Care",
		step: 7,
		lightHex: "#ffe4e6",
		strongHex: "#d980a2",
		strongFillHex: "#eca6c0",
		active: "border-rose-400 bg-gradient-to-br from-rose-50 via-rose-100 to-rose-200 text-rose-950 ring-2 ring-rose-200 shadow-[0_16px_32px_-24px_rgba(159,18,57,0.32)]",
		idle: "border-rose-200 bg-rose-50/80 text-rose-900 hover:border-rose-300 hover:bg-rose-100/80",
		card: "border-rose-200/80 bg-[#fff2f7]",
		inner: "border-rose-100 bg-white/92",
		selected:
			"border-rose-600 bg-rose-200 text-rose-950 ring-1 ring-rose-300 shadow-[0_10px_22px_-18px_rgba(159,18,57,0.3)]",
		instruction: "border-[#f1a7c8] bg-[#de7cab] text-white",
		progress: "border-rose-200/80 bg-rose-50/80",
		condition: "border-rose-300 bg-rose-100/85",
		fillClass: "bg-rose-400",
		borderClass: "border-rose-300",
		textClass: "text-rose-900"
	},
	useAndUsability: {
		label: "Use & Usability",
		step: 8,
		lightHex: "#ede9fe",
		strongHex: "#8f79d6",
		strongFillHex: "#b19af0",
		active: "border-violet-400 bg-gradient-to-br from-violet-50 via-violet-100 to-violet-200 text-violet-950 ring-2 ring-violet-200 shadow-[0_16px_32px_-24px_rgba(91,33,182,0.34)]",
		idle: "border-violet-200 bg-violet-50/80 text-violet-900 hover:border-violet-300 hover:bg-violet-100/80",
		card: "border-violet-200/80 bg-[#f7f2ff]",
		inner: "border-violet-100 bg-white/92",
		selected:
			"border-violet-600 bg-violet-200 text-violet-950 ring-1 ring-violet-300 shadow-[0_10px_22px_-18px_rgba(91,33,182,0.32)]",
		instruction: "border-[#ccb2ff] bg-[#9d7fe8] text-white",
		progress: "border-violet-200/80 bg-violet-50/80",
		condition: "border-violet-300 bg-violet-100/85",
		fillClass: "bg-violet-500",
		borderClass: "border-violet-300",
		textClass: "text-violet-900"
	}
};

export function getThemeByStep(step: YeeStepNumber) {
	return Object.values(yeeDomainThemes).find(theme => theme.step === step) ?? null;
}
