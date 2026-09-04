/**
 * Guard tests for the canonical score formatter.
 *
 * The property that matters most here is the absence of a fabricated 0%: a
 * missing or zero maximum must surface as an unavailable state, because the six
 * hand-rolled `max ? (value / max) * 100 : 0` copies this module replaces all
 * rendered a believable "0%" instead.
 */
import { expect, test } from "@playwright/test";

import {
	SCORE_UNAVAILABLE,
	aggregateScoreEntries,
	formatScoreFraction,
	formatScorePercent,
	formatScoreSummary,
	scorePercent,
	scorePercentage
} from "../../src/lib/score-format";
import { scoreBandKey } from "../../src/lib/score-band";

test("scorePercent rounds a normal score to a whole percent", () => {
	expect(scorePercent(18, 125)).toBe(14);
	expect(formatScorePercent(18, 125)).toBe("14%");
	expect(formatScoreSummary(18, 125)).toBe("14% (18 / 125)");
});

test("a maximum of 0 is unavailable, never a fabricated 0%", () => {
	expect(scorePercent(0, 0)).toBeNull();
	expect(formatScorePercent(0, 0)).toBeNull();
	expect(formatScoreFraction(0, 0)).toBe(SCORE_UNAVAILABLE);
	expect(formatScoreSummary(0, 0)).toBe(SCORE_UNAVAILABLE);
});

test("a negative maximum is unavailable", () => {
	expect(scorePercentage(10, -100)).toBeNull();
	expect(scorePercent(10, -100)).toBeNull();
	expect(formatScoreFraction(10, -100)).toBe(SCORE_UNAVAILABLE);
	expect(formatScoreSummary(10, -100)).toBe(SCORE_UNAVAILABLE);
});

test("null and undefined inputs are unavailable on either side", () => {
	expect(scorePercent(null, 125)).toBeNull();
	expect(scorePercent(18, null)).toBeNull();
	expect(scorePercent(undefined, undefined)).toBeNull();
	expect(formatScorePercent(18, undefined)).toBeNull();
	expect(formatScoreFraction(null, 125)).toBe(SCORE_UNAVAILABLE);
	expect(formatScoreFraction(18, undefined)).toBe(SCORE_UNAVAILABLE);
	expect(formatScoreSummary(undefined, 125)).toBe(SCORE_UNAVAILABLE);
});

test("non-finite inputs are unavailable", () => {
	expect(scorePercent(Number.NaN, 125)).toBeNull();
	expect(scorePercent(18, Number.NaN)).toBeNull();
	expect(scorePercent(Number.POSITIVE_INFINITY, 125)).toBeNull();
	expect(formatScoreFraction(Number.NaN, 125)).toBe(SCORE_UNAVAILABLE);
	expect(formatScoreSummary(18, Number.POSITIVE_INFINITY)).toBe(SCORE_UNAVAILABLE);
});

test("percentages are clamped to 0-100", () => {
	expect(scorePercent(150, 100)).toBe(100);
	expect(scorePercent(-25, 100)).toBe(0);
	expect(formatScorePercent(150, 100)).toBe("100%");
	expect(formatScorePercent(-25, 100)).toBe("0%");
});

test("fractionDigits 2 formats both sides of a weighted score", () => {
	expect(formatScoreFraction(0.2812, 2.2249, 2)).toBe("0.28 / 2.22");
	expect(formatScoreFraction(1, 2, 2)).toBe("1.00 / 2.00");
	expect(formatScoreFraction(18, 125)).toBe("18 / 125");
	expect(formatScoreSummary(0.2812, 2.2249, 2)).toBe("13% (0.28 / 2.22)");
});

test("aggregateScoreEntries averages valid per-audit percentages and excludes unavailable maxima", () => {
	const aggregate = aggregateScoreEntries([
		{ value: 50, maximum: 100 },
		{ value: 150, maximum: 200 },
		{ value: 999, maximum: null },
		{ value: 999, maximum: 0 },
		{ value: 999, maximum: Number.NaN }
	]);

	expect(aggregate.validCount).toBe(2);
	expect(aggregate.meanValue).toBe(100);
	expect(aggregate.meanPercentage).toBe(62.5);
	expect(aggregate.sharedMaximum).toBeNull();
});

test("aggregateScoreEntries exposes a fraction denominator only for one shared positive maximum", () => {
	const shared = aggregateScoreEntries([
		{ value: 25, maximum: 100 },
		{ value: 75, maximum: 100 }
	]);
	const unavailable = aggregateScoreEntries([{ value: 0, maximum: null }]);

	expect(shared).toEqual({
		meanValue: 50,
		meanPercentage: 50,
		sharedMaximum: 100,
		validCount: 2
	});
	expect(unavailable).toEqual({
		meanValue: null,
		meanPercentage: null,
		sharedMaximum: null,
		validCount: 0
	});
});

test("a non-finite percent bands as low, not reassuring green", () => {
	expect(scoreBandKey(Number.NaN)).toBe("low");
	expect(scoreBandKey(Number.POSITIVE_INFINITY)).toBe("low");
	expect(scoreBandKey(33)).toBe("low");
	expect(scoreBandKey(34)).toBe("mid");
	expect(scoreBandKey(66)).toBe("mid");
	expect(scoreBandKey(67)).toBe("high");
});
