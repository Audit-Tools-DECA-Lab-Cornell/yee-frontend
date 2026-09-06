/**
 * Guard tests for score track geometry.
 *
 * The property that matters here is the absence of a minimum fill. The bar
 * renderer these helpers replace used `Math.max(12, clamp(value))` so that a
 * zero score still drew a visible sliver, which made 0% and 12% render at
 * identical length — a reader could not tell "nobody scored this" from "a
 * twelfth of the available points".
 */
import { expect, test } from "@playwright/test";

import { clampScorePercent, scoreTrackLength } from "../../src/lib/score-band";

test("a zero score draws no fill at all", () => {
	expect(scoreTrackLength(0)).toBe("0%");
});

test("a low score is distinguishable from zero", () => {
	expect(scoreTrackLength(12)).toBe("12%");
	expect(scoreTrackLength(12)).not.toBe(scoreTrackLength(0));
	expect(scoreTrackLength(1)).toBe("1%");
});

test("the track clamps to the range it can draw", () => {
	expect(clampScorePercent(-20)).toBe(0);
	expect(clampScorePercent(140)).toBe(100);
	expect(scoreTrackLength(-20)).toBe("0%");
	expect(scoreTrackLength(140)).toBe("100%");
});

test("a non-finite percentage draws nothing rather than an arbitrary length", () => {
	expect(clampScorePercent(Number.NaN)).toBe(0);
	expect(clampScorePercent(Number.POSITIVE_INFINITY)).toBe(0);
	expect(scoreTrackLength(Number.NaN)).toBe("0%");
});

test("fractional percentages survive to the style value", () => {
	expect(scoreTrackLength(33.5)).toBe("33.5%");
});
