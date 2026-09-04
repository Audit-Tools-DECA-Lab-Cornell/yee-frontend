/**
 * Single source of truth for score-band coloring across the app.
 *
 * Replaces scattered component-level color logic with one shared scale. Vivid
 * traffic-light fills are paired with darker text colors for readable labels
 * (see `--score-*` in globals.css).
 *
 * Thresholds preserve the prior behavior: <34 low, <67 mid, otherwise high.
 */

export type ScoreBand = "low" | "mid" | "high";

export function scoreBandKey(percent: number): ScoreBand {
	if (percent < 34) return "low";
	if (percent < 67) return "mid";
	return "high";
}

type ScoreBandClasses = {
	/** Vivid solid fill (bars, dots) — e.g. `bg-score-high-fill`. */
	fill: string;
	/** Foreground text — e.g. `text-score-high`. */
	text: string;
	/** Tinted background — e.g. `bg-score-high-bg`. */
	bg: string;
	/** Border — e.g. `border-score-high`. */
	border: string;
};

const BAND_CLASSES: Record<ScoreBand, ScoreBandClasses> = {
	low: { fill: "bg-score-low-fill", text: "text-score-low", bg: "bg-score-low-bg", border: "border-score-low" },
	mid: { fill: "bg-score-mid-fill", text: "text-score-mid", bg: "bg-score-mid-bg", border: "border-score-mid" },
	high: {
		fill: "bg-score-high-fill",
		text: "text-score-high",
		bg: "bg-score-high-bg",
		border: "border-score-high"
	}
};

const BAND_VAR: Record<ScoreBand, string> = {
	low: "var(--score-low-fill)",
	mid: "var(--score-mid-fill)",
	high: "var(--score-high-fill)"
};

/** Tailwind class set for a percentage (0–100). */
export function scoreBand(percent: number): ScoreBandClasses {
	return BAND_CLASSES[scoreBandKey(percent)];
}

/** Raw CSS color value for a percentage — for inline SVG `fill`/`stroke`. */
export function scoreBandColor(percent: number): string {
	return BAND_VAR[scoreBandKey(percent)];
}
