/**
 * Single source of truth for score-band coloring across the app.
 *
 * Replaces the scattered rose-400 / amber-400 / emerald-500 logic that used to
 * live in each chart/progress component with one brand-tuned scale (deep green
 * high, muted gold mid, restrained clay low — see `--score-*` in globals.css).
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
	/** Solid fill (bars, dots) — e.g. `bg-score-high`. */
	fill: string;
	/** Foreground text — e.g. `text-score-high`. */
	text: string;
	/** Tinted background — e.g. `bg-score-high-bg`. */
	bg: string;
	/** Border — e.g. `border-score-high`. */
	border: string;
};

const BAND_CLASSES: Record<ScoreBand, ScoreBandClasses> = {
	low: { fill: "bg-score-low", text: "text-score-low", bg: "bg-score-low-bg", border: "border-score-low" },
	mid: { fill: "bg-score-mid", text: "text-score-mid", bg: "bg-score-mid-bg", border: "border-score-mid" },
	high: { fill: "bg-score-high", text: "text-score-high", bg: "bg-score-high-bg", border: "border-score-high" }
};

const BAND_VAR: Record<ScoreBand, string> = {
	low: "var(--score-low)",
	mid: "var(--score-mid)",
	high: "var(--score-high)"
};

/** Tailwind class set for a percentage (0–100). */
export function scoreBand(percent: number): ScoreBandClasses {
	return BAND_CLASSES[scoreBandKey(percent)];
}

/** Raw CSS color value for a percentage — for inline SVG `fill`/`stroke`. */
export function scoreBandColor(percent: number): string {
	return BAND_VAR[scoreBandKey(percent)];
}
