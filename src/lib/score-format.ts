/**
 * Single source of truth for how an audit score is turned into display text.
 *
 * Two problems this module exists to fix:
 *
 *   1. The percent maths (`max ? (value / max) * 100 : 0`) had been
 *      reimplemented in six places - the score summary, the comparison panel,
 *      the auditor history card, the live dashboard, the score cell and the
 *      export row builders - each with slightly different rounding and
 *      clamping. One helper, one rounding rule.
 *   2. Those copies used `: 0` as the fallback, so an audit whose maximum was
 *      missing rendered a real, believable "0%" (and a red score band) instead
 *      of admitting the number was unknown. `scorePercent` returns `null` in
 *      that case and callers MUST render `SCORE_UNAVAILABLE`; a fabricated 0%
 *      is never acceptable.
 *
 * Display order is percent-first: the percentage is the headline (large, bold)
 * and the raw fraction is secondary (small, muted). React components compose
 * that themselves from `scorePercent` + `formatScoreFraction` so they can apply
 * their own typography tokens; plain-text contexts (PDF cells, aria-labels)
 * use `formatScoreSummary`.
 */

/** Em dash rendered wherever a score or its denominator is unavailable. */
export const SCORE_UNAVAILABLE = "—";

function isFiniteNumber(value?: number | null): value is number {
	return typeof value === "number" && Number.isFinite(value);
}

/**
 * Precise percent of `value` against `max`, clamped to 0–100.
 *
 * Returns `null` when either side is missing/non-finite or `max` is not
 * positive. Aggregate helpers use this unrounded value so they calculate the
 * mean of each audit's own percentage without introducing per-row rounding.
 */
export function scorePercentage(value?: number | null, max?: number | null): number | null {
	if (!isFiniteNumber(value) || !isFiniteNumber(max) || max <= 0) return null;
	return Math.min(100, Math.max(0, (value / max) * 100));
}

/** Whole-number display percentage using {@link scorePercentage}. */
export function scorePercent(value?: number | null, max?: number | null): number | null {
	const percentage = scorePercentage(value, max);
	return percentage === null ? null : Math.round(percentage);
}

/** `"14%"`, or `null` on the same rules as {@link scorePercent}. */
export function formatScorePercent(value?: number | null, max?: number | null): string | null {
	const percent = scorePercent(value, max);
	return percent === null ? null : `${percent}%`;
}

/**
 * `"18 / 125"`, or `"0.28 / 2.22"` with `fractionDigits` 2 (weighted scores).
 *
 * Returns {@link SCORE_UNAVAILABLE} when either side is missing/non-finite or
 * the maximum is not positive. A non-positive denominator cannot describe a
 * meaningful score fraction.
 */
export function formatScoreFraction(value?: number | null, max?: number | null, fractionDigits = 0): string {
	if (!isFiniteNumber(value) || !isFiniteNumber(max) || max <= 0) return SCORE_UNAVAILABLE;
	if (fractionDigits > 0) return `${value.toFixed(fractionDigits)} / ${max.toFixed(fractionDigits)}`;
	return `${value} / ${max}`;
}

/**
 * `"14% (18 / 125)"` - the percent-first summary as one string, for plain-text
 * contexts such as PDF table cells and aria-labels. Returns
 * {@link SCORE_UNAVAILABLE} when the score or its denominator is unavailable.
 */
export function formatScoreSummary(value?: number | null, max?: number | null, fractionDigits = 0): string {
	const percent = formatScorePercent(value, max);
	if (percent === null) return SCORE_UNAVAILABLE;
	const fraction = formatScoreFraction(value, max, fractionDigits);
	if (fraction === SCORE_UNAVAILABLE) return SCORE_UNAVAILABLE;
	return `${percent} (${fraction})`;
}

export type ScoreEntry = {
	value?: number | null;
	maximum?: number | null;
};

export type ScoreAggregate = {
	/** Mean score points across only records with usable score percentages. */
	meanValue: number | null;
	/** Mean of each included record's own precise percentage. */
	meanPercentage: number | null;
	/** Shared positive maximum across every selected record, otherwise `null`. */
	sharedMaximum: number | null;
	/** Number of records included after score/maximum validation. */
	validCount: number;
};

/**
 * Aggregate scores without borrowing a denominator or treating unavailable
 * records as 0%. Invalid records are excluded from the percentage mean, but a
 * fraction is safe only when every selected record is valid and shares the same
 * positive maximum.
 */
export function aggregateScoreEntries(entries: readonly ScoreEntry[]): ScoreAggregate {
	const valid = entries.flatMap(entry => {
		const percentage = scorePercentage(entry.value, entry.maximum);
		if (percentage === null || !isFiniteNumber(entry.value) || !isFiniteNumber(entry.maximum)) return [];
		return [{ value: entry.value, maximum: entry.maximum, percentage }];
	});

	if (valid.length === 0) {
		return { meanValue: null, meanPercentage: null, sharedMaximum: null, validCount: 0 };
	}

	const firstMaximum = valid[0].maximum;
	const sharedMaximum =
		valid.length === entries.length && valid.every(entry => entry.maximum === firstMaximum) ? firstMaximum : null;

	return {
		meanValue: valid.reduce((sum, entry) => sum + entry.value, 0) / valid.length,
		meanPercentage: valid.reduce((sum, entry) => sum + entry.percentage, 0) / valid.length,
		sharedMaximum,
		validCount: valid.length
	};
}
