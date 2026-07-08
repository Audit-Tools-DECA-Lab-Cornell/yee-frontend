import { expect, test } from "@playwright/test";

import { buildDomainBarsSvg } from "../../src/features/reporting/export/charts/domain-bars";
import { buildGroupedBarsSvg } from "../../src/features/reporting/export/charts/grouped-bars";
import { buildRadarSvg } from "../../src/features/reporting/export/charts/radar";
import { buildTrendSvg } from "../../src/features/reporting/export/charts/trend";
import { getExportPalette, FALLBACK_HEX_TABLE } from "../../src/features/reporting/export/export-palette";
import { domainLabels, domainOrder } from "../../src/features/reporting/export/types";

// Non-DOM (node) environment: getExportPalette() returns the fallback table, so
// every builder is exercised against known hexes with no browser needed.
const palette = getExportPalette();
const axisLabels = domainOrder.map(domain => domainLabels[domain]);

/** A well-formed standalone SVG: single root, no classes, no CSS vars. */
function assertStandaloneSvg(svg: string) {
	expect(svg.startsWith("<svg")).toBeTruthy();
	expect(svg.trimEnd().endsWith("</svg>")).toBeTruthy();
	expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
	// Standalone requirement (D3): no CSS classes, no unresolved custom properties.
	expect(svg).not.toContain("class=");
	expect(svg).not.toContain("var(--");
	// Balanced tags for the elements we emit.
	expect((svg.match(/<svg/g) ?? []).length).toBe(1);
}

test("radar builder emits a standalone SVG with one polygon per series", () => {
	const svg = buildRadarSvg({
		axisLabels,
		palette,
		series: [
			{ label: "Riverside Park", color: palette.chartSeries[0], values: [80, 60, 55, 70, 45, 65] },
			{ label: "Lincoln Square", color: palette.chartSeries[1], values: [50, 70, 40, 60, 75, 55] }
		]
	});
	assertStandaloneSvg(svg);
	expect((svg.match(/<polygon/g) ?? []).length).toBeGreaterThanOrEqual(2 + 4); // 2 series + rings
	expect(svg).toContain(palette.chartSeries[0]);
	expect(svg).toContain("Riverside Park");
});

test("trend builder emits two polylines and the axis labels", () => {
	const svg = buildTrendSvg({
		palette,
		points: [
			{ label: "2026-01", rawPercent: 40, weightedPercent: 45 },
			{ label: "2026-04", rawPercent: 58, weightedPercent: 63 },
			{ label: "2026-07", rawPercent: 66, weightedPercent: 72 }
		]
	});
	assertStandaloneSvg(svg);
	expect((svg.match(/<polyline/g) ?? []).length).toBe(2);
	expect(svg).toContain("Raw Score %");
	expect(svg).toContain("Youth Weighted Average %");
});

test("domain-bars builder tints each row with its domain color", () => {
	const svg = buildDomainBarsSvg({
		palette,
		rows: domainOrder.map((domain, index) => ({
			domainKey: domain,
			label: domainLabels[domain],
			rawPercent: 40 + index * 8,
			weightedPercent: 45 + index * 6
		}))
	});
	assertStandaloneSvg(svg);
	// Each domain's fill hex appears (raw bar) — proves domain coloring.
	expect(svg).toContain(FALLBACK_HEX_TABLE["domain-access-fill"]);
	expect(svg).toContain(FALLBACK_HEX_TABLE["domain-use-strong"]);
});

test("grouped-bars builder draws one bar per series in each domain group", () => {
	const series = [
		{ label: "Audit A", color: palette.chartSeries[0] },
		{ label: "Audit B", color: palette.chartSeries[1] }
	];
	const svg = buildGroupedBarsSvg({
		palette,
		series,
		groups: axisLabels.map((label, index) => ({ label, values: [50 + index * 4, 60 - index * 3] }))
	});
	assertStandaloneSvg(svg);
	expect((svg.match(/<rect/g) ?? []).length).toBeGreaterThanOrEqual(domainOrder.length * series.length);
	expect(svg).toContain("Audit A");
});

test("fallback palette exposes every domain and score-band color", () => {
	for (const domain of domainOrder) {
		expect(palette.domains[domain].strong).toMatch(/^#[0-9a-f]{6}$/);
	}
	expect(palette.bands.high.fg).toMatch(/^#[0-9a-f]{6}$/);
	expect(palette.chartSeries).toHaveLength(5);
});
