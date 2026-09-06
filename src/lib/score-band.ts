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

/**
 * Band for a percentage (0–100).
 *
 * A non-finite percent maps to "low" explicitly: without the guard `NaN < 34`
 * and `NaN < 67` are both false, so a broken percentage fell through to "high"
 * and rendered reassuring green. Callers with no percentage at all should skip
 * the band entirely and render `SCORE_UNAVAILABLE` (see `@/lib/score-format`).
 */
export function scoreBandKey(percent: number): ScoreBand {
	if (!Number.isFinite(percent)) return "low";
	if (percent < 34) return "low";
	if (percent < 67) return "mid";
	return "high";
}

type ScoreBandClasses = {
	/** Vivid solid fill (bars, dots) - e.g. `bg-score-high-fill`. */
	fill: string;
	/** Foreground text - e.g. `text-score-high`. */
	text: string;
	/** Tinted background - e.g. `bg-score-high-bg`. */
	bg: string;
	/** Border - e.g. `border-score-high`. */
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

/** Raw CSS color value for a percentage - for inline SVG `fill`/`stroke`. */
export function scoreBandColor(percent: number): string {
	return BAND_VAR[scoreBandKey(percent)];
}

/** Percentage clamped into the 0–100 a score track can actually draw. */
export function clampScorePercent(percent: number): number {
	if (!Number.isFinite(percent)) return 0;
	return Math.min(100, Math.max(0, percent));
}

/**
 * Filled length of a score track, as a CSS percentage.
 *
 * There is deliberately no minimum. The bar renderer this replaces floored the
 * fill at 12% so that a zero score still drew a visible sliver, which made 0%
 * and 12% indistinguishable — a reader could not tell "nobody scored this" from
 * "a twelfth of the available points". Zero renders as zero length, and the
 * empty track is the signal.
 */
export function scoreTrackLength(percent: number): string {
	return `${clampScorePercent(percent)}%`;
}
