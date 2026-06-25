import type { YeeDomainKey, YeeStepNumber } from "@/lib/yee-audit-config";

type DomainTheme = {
	label: string;
	step: YeeStepNumber;
	/** Light background hex — used for review panels, keeping visual differentiation. */
	lightHex: string;
	/** Strong foreground hex — used for text and borders in review mode. */
	strongHex: string;
	/** Medium fill hex — used for accents in review mode. */
	strongFillHex: string;

	/** Tailwind classes for an active/focused step nav or card border. */
	borderClass: string;
	/** Tailwind classes for text in domain context. */
	textClass: string;
	/** Tailwind classes for a progress bar fill. */
	fillClass: string;

	/**
	 * Option card classes:
	 * selected — solid 2px border + light tint bg (no stacked shadows/gradients)
	 * idle — subtle border + white bg with hover
	 */
	selectedBorderClass: string;
	selectedBgClass: string;
	idleClass: string;

	/** Instruction box style (domain intro callout). */
	instruction: string;
	/** Section/domain card wrapper. */
	card: string;
	/** Condition sub-item style. */
	condition: string;
	/** Progress track style. */
	progress: string;
};

export const yeeDomainThemes: Record<YeeDomainKey, DomainTheme> = {
	access: {
		label: "Access",
		step: 3,
		lightHex: "#dcefe0",
		strongHex: "#5c8f68",
		strongFillHex: "#7fb58b",
		borderClass: "border-emerald-300",
		textClass: "text-emerald-900",
		fillClass: "bg-emerald-500",
		selectedBorderClass: "border-emerald-500",
		selectedBgClass: "bg-emerald-50",
		idleClass: "border-border bg-background hover:bg-emerald-50/50",
		instruction: "border-emerald-300 bg-emerald-100 text-emerald-900",
		card: "border-emerald-200/80 bg-emerald-50/30",
		condition: "border-emerald-200 bg-emerald-50",
		progress: "border-emerald-200/80 bg-emerald-50/50"
	},
	activitySpaces: {
		label: "Activity Spaces",
		step: 4,
		lightHex: "#dfe8ff",
		strongHex: "#6d8fe0",
		strongFillHex: "#95aff5",
		borderClass: "border-blue-300",
		textClass: "text-blue-900",
		fillClass: "bg-blue-500",
		selectedBorderClass: "border-blue-500",
		selectedBgClass: "bg-blue-50",
		idleClass: "border-border bg-background hover:bg-blue-50/50",
		instruction: "border-blue-300 bg-blue-100 text-blue-900",
		card: "border-blue-200/80 bg-blue-50/30",
		condition: "border-blue-200 bg-blue-50",
		progress: "border-blue-200/80 bg-blue-50/50"
	},
	amenities: {
		label: "Amenities",
		step: 5,
		lightHex: "#fef3c7",
		strongHex: "#d6a43b",
		strongFillHex: "#e8be63",
		borderClass: "border-amber-300",
		textClass: "text-amber-900",
		fillClass: "bg-amber-500",
		selectedBorderClass: "border-amber-500",
		selectedBgClass: "bg-amber-50",
		idleClass: "border-border bg-background hover:bg-amber-50/50",
		instruction: "border-amber-300 bg-amber-100 text-amber-900",
		card: "border-amber-200/80 bg-amber-50/30",
		condition: "border-amber-200 bg-amber-50",
		progress: "border-amber-200/80 bg-amber-50/50"
	},
	experienceOfSpace: {
		label: "Experience of the Space",
		step: 6,
		lightHex: "#ccfbf1",
		strongHex: "#4db5aa",
		strongFillHex: "#67cdc0",
		borderClass: "border-teal-300",
		textClass: "text-teal-900",
		fillClass: "bg-teal-500",
		selectedBorderClass: "border-teal-500",
		selectedBgClass: "bg-teal-50",
		idleClass: "border-border bg-background hover:bg-teal-50/50",
		instruction: "border-teal-300 bg-teal-100 text-teal-900",
		card: "border-teal-200/80 bg-teal-50/30",
		condition: "border-teal-200 bg-teal-50",
		progress: "border-teal-200/80 bg-teal-50/50"
	},
	aestheticsAndCare: {
		label: "Aesthetics & Care",
		step: 7,
		lightHex: "#ffe4e6",
		strongHex: "#d980a2",
		strongFillHex: "#eca6c0",
		borderClass: "border-rose-300",
		textClass: "text-rose-900",
		fillClass: "bg-rose-400",
		selectedBorderClass: "border-rose-500",
		selectedBgClass: "bg-rose-50",
		idleClass: "border-border bg-background hover:bg-rose-50/50",
		instruction: "border-rose-300 bg-rose-100 text-rose-900",
		card: "border-rose-200/80 bg-rose-50/30",
		condition: "border-rose-200 bg-rose-50",
		progress: "border-rose-200/80 bg-rose-50/50"
	},
	useAndUsability: {
		label: "Use & Usability",
		step: 8,
		lightHex: "#ede9fe",
		strongHex: "#8f79d6",
		strongFillHex: "#b19af0",
		borderClass: "border-violet-300",
		textClass: "text-violet-900",
		fillClass: "bg-violet-500",
		selectedBorderClass: "border-violet-500",
		selectedBgClass: "bg-violet-50",
		idleClass: "border-border bg-background hover:bg-violet-50/50",
		instruction: "border-violet-300 bg-violet-100 text-violet-900",
		card: "border-violet-200/80 bg-violet-50/30",
		condition: "border-violet-200 bg-violet-50",
		progress: "border-violet-200/80 bg-violet-50/50"
	}
};

export function getThemeByStep(step: YeeStepNumber) {
	return Object.values(yeeDomainThemes).find(theme => theme.step === step) ?? null;
}
