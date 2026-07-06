import type { YeeDomainKey, YeeStepNumber } from "@/features/yee-audit/config/yee-audit-config";

/**
 * Domain color theme — the ONE place the app maps YEE domains to colors.
 *
 * The actual color VALUES live entirely in `--domain-<name>-{text,strong,fill,light}`
 * in `src/app/globals.css` (the single source of truth). This file only references
 * those tokens: the `*Hex` fields as raw `var(--domain-*)` (for inline styles / SVG
 * in charts, reports, and the individual report) and the `*Class` fields as Tailwind
 * utilities generated from the same tokens (`domain-*` color namespace — used by the
 * audit wizard). Adjust a color in globals.css and it updates everywhere.
 *
 * NOTE: the `*Class` strings are written out literally per domain (not generated) so
 * Tailwind's content scanner sees them and emits the corresponding utilities.
 */
type DomainTheme = {
	label: string;
	step: YeeStepNumber;
	/** Raw CSS color (`var(--domain-*)`) — tint background for inline styles/SVG. */
	lightHex: string;
	/** Raw CSS color — borders/dots/lines for inline styles/SVG. */
	strongHex: string;
	/** Raw CSS color — bar/area fills for inline styles/SVG. */
	strongFillHex: string;

	/** Active/focused step-nav or card border. */
	borderClass: string;
	/** Domain-context text. */
	textClass: string;
	/** Progress-bar fill. */
	fillClass: string;

	/** Option card: selected = solid border + light tint; idle = subtle + hover tint. */
	selectedBorderClass: string;
	selectedBgClass: string;
	idleClass: string;

	/** Instruction/callout box. */
	instruction: string;
	/** Section/domain card wrapper. */
	card: string;
	/** Condition sub-item. */
	condition: string;
	/** Progress track. */
	progress: string;
};

export const yeeDomainThemes: Record<YeeDomainKey, DomainTheme> = {
	access: {
		label: "Access",
		step: 3,
		lightHex: "var(--domain-access-light)",
		strongHex: "var(--domain-access-strong)",
		strongFillHex: "var(--domain-access-fill)",
		borderClass: "border-domain-access-strong",
		textClass: "text-domain-access-text",
		fillClass: "bg-domain-access-fill",
		selectedBorderClass: "border-domain-access-strong",
		selectedBgClass: "bg-domain-access-light",
		idleClass: "border-border bg-background hover:bg-domain-access-light/50",
		instruction: "border-domain-access-strong bg-domain-access-light text-domain-access-text",
		card: "border-domain-access-strong/20 bg-domain-access-light/40",
		condition: "border-domain-access-strong/25 bg-domain-access-light",
		progress: "border-domain-access-strong/20 bg-domain-access-light/50"
	},
	activitySpaces: {
		label: "Activity Spaces",
		step: 4,
		lightHex: "var(--domain-activity-light)",
		strongHex: "var(--domain-activity-strong)",
		strongFillHex: "var(--domain-activity-fill)",
		borderClass: "border-domain-activity-strong",
		textClass: "text-domain-activity-text",
		fillClass: "bg-domain-activity-fill",
		selectedBorderClass: "border-domain-activity-strong",
		selectedBgClass: "bg-domain-activity-light",
		idleClass: "border-border bg-background hover:bg-domain-activity-light/50",
		instruction: "border-domain-activity-strong bg-domain-activity-light text-domain-activity-text",
		card: "border-domain-activity-strong/20 bg-domain-activity-light/40",
		condition: "border-domain-activity-strong/25 bg-domain-activity-light",
		progress: "border-domain-activity-strong/20 bg-domain-activity-light/50"
	},
	amenities: {
		label: "Amenities",
		step: 5,
		lightHex: "var(--domain-amenities-light)",
		strongHex: "var(--domain-amenities-strong)",
		strongFillHex: "var(--domain-amenities-fill)",
		borderClass: "border-domain-amenities-strong",
		textClass: "text-domain-amenities-text",
		fillClass: "bg-domain-amenities-fill",
		selectedBorderClass: "border-domain-amenities-strong",
		selectedBgClass: "bg-domain-amenities-light",
		idleClass: "border-border bg-background hover:bg-domain-amenities-light/50",
		instruction: "border-domain-amenities-strong bg-domain-amenities-light text-domain-amenities-text",
		card: "border-domain-amenities-strong/20 bg-domain-amenities-light/40",
		condition: "border-domain-amenities-strong/25 bg-domain-amenities-light",
		progress: "border-domain-amenities-strong/20 bg-domain-amenities-light/50"
	},
	experienceOfSpace: {
		label: "Experience of the Space",
		step: 6,
		lightHex: "var(--domain-experience-light)",
		strongHex: "var(--domain-experience-strong)",
		strongFillHex: "var(--domain-experience-fill)",
		borderClass: "border-domain-experience-strong",
		textClass: "text-domain-experience-text",
		fillClass: "bg-domain-experience-fill",
		selectedBorderClass: "border-domain-experience-strong",
		selectedBgClass: "bg-domain-experience-light",
		idleClass: "border-border bg-background hover:bg-domain-experience-light/50",
		instruction: "border-domain-experience-strong bg-domain-experience-light text-domain-experience-text",
		card: "border-domain-experience-strong/20 bg-domain-experience-light/40",
		condition: "border-domain-experience-strong/25 bg-domain-experience-light",
		progress: "border-domain-experience-strong/20 bg-domain-experience-light/50"
	},
	aestheticsAndCare: {
		label: "Aesthetics & Care",
		step: 7,
		lightHex: "var(--domain-aesthetics-light)",
		strongHex: "var(--domain-aesthetics-strong)",
		strongFillHex: "var(--domain-aesthetics-fill)",
		borderClass: "border-domain-aesthetics-strong",
		textClass: "text-domain-aesthetics-text",
		fillClass: "bg-domain-aesthetics-fill",
		selectedBorderClass: "border-domain-aesthetics-strong",
		selectedBgClass: "bg-domain-aesthetics-light",
		idleClass: "border-border bg-background hover:bg-domain-aesthetics-light/50",
		instruction: "border-domain-aesthetics-strong bg-domain-aesthetics-light text-domain-aesthetics-text",
		card: "border-domain-aesthetics-strong/20 bg-domain-aesthetics-light/40",
		condition: "border-domain-aesthetics-strong/25 bg-domain-aesthetics-light",
		progress: "border-domain-aesthetics-strong/20 bg-domain-aesthetics-light/50"
	},
	useAndUsability: {
		label: "Use & Usability",
		step: 8,
		lightHex: "var(--domain-use-light)",
		strongHex: "var(--domain-use-strong)",
		strongFillHex: "var(--domain-use-fill)",
		borderClass: "border-domain-use-strong",
		textClass: "text-domain-use-text",
		fillClass: "bg-domain-use-fill",
		selectedBorderClass: "border-domain-use-strong",
		selectedBgClass: "bg-domain-use-light",
		idleClass: "border-border bg-background hover:bg-domain-use-light/50",
		instruction: "border-domain-use-strong bg-domain-use-light text-domain-use-text",
		card: "border-domain-use-strong/20 bg-domain-use-light/40",
		condition: "border-domain-use-strong/25 bg-domain-use-light",
		progress: "border-domain-use-strong/20 bg-domain-use-light/50"
	}
};

export function getThemeByStep(step: YeeStepNumber) {
	return Object.values(yeeDomainThemes).find(theme => theme.step === step) ?? null;
}
