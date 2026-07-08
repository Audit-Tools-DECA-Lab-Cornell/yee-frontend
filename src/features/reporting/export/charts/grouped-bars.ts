/**
 * Grouped bar chart builder — standalone SVG. For R4: each domain is a group of
 * N vertical bars, one per selected audit (series-colored). Grouped side-by-side
 * reads more clearly than stacked when comparing 2–3 audits (logistics §6).
 */
import type { ExportPalette } from "../types";
import { clampPercent } from "./geometry";
import { svgDocument, svgLegend, svgLine, svgRect, svgText } from "./svg-primitives";

export type GroupedBarsSeries = { label: string; color: string };

export type GroupedBarsGroup = {
	label: string;
	/** One value per series, 0–100, in series order. */
	values: number[];
};

const GRID_VALUES = [0, 25, 50, 75, 100];

export function buildGroupedBarsSvg(options: {
	groups: GroupedBarsGroup[];
	series: GroupedBarsSeries[];
	palette: ExportPalette;
	width?: number;
	height?: number;
	title?: string;
}): string {
	const { groups, series, palette, width = 760, height = 400, title } = options;
	const padding = 44;
	const plotTop = 16;
	const plotBottom = height - 48;
	const plotLeft = padding;
	const plotRight = width - 16;
	const plotWidth = plotRight - plotLeft;
	const plotHeight = plotBottom - plotTop;
	const parts: string[] = [];

	const yFor = (percent: number) => plotBottom - (plotHeight * clampPercent(percent)) / 100;

	// Gridlines + y labels.
	for (const value of GRID_VALUES) {
		const y = yFor(value);
		parts.push(svgLine(plotLeft, y, plotRight, y, palette.grid, { width: 1, dash: "3 3" }));
		parts.push(
			svgText({ x: plotLeft - 8, y: y + 4, text: `${value}%`, fill: palette.axis, size: 10, anchor: "end" })
		);
	}

	const groupWidth = plotWidth / Math.max(groups.length, 1);
	const groupInnerPad = groupWidth * 0.16;
	const barAreaWidth = groupWidth - groupInnerPad * 2;
	const barWidth = barAreaWidth / Math.max(series.length, 1);

	groups.forEach((group, groupIndex) => {
		const groupLeft = plotLeft + groupIndex * groupWidth + groupInnerPad;
		group.values.forEach((value, seriesIndex) => {
			const barLeft = groupLeft + seriesIndex * barWidth;
			const barTop = yFor(value);
			const barHeight = plotBottom - barTop;
			const color = series[seriesIndex]?.color ?? palette.chartSeries[seriesIndex % palette.chartSeries.length];
			if (barHeight > 0) {
				parts.push(svgRect(barLeft + 1, barTop, Math.max(barWidth - 2, 1), barHeight, color, { rx: 2 }));
			}
		});
		// Group (domain) label, wrapped to two lines if needed.
		const centerX = groupLeft + barAreaWidth / 2;
		const words = group.label.split(" ");
		const line1 = words.slice(0, Math.ceil(words.length / 2)).join(" ");
		const line2 = words.slice(Math.ceil(words.length / 2)).join(" ");
		parts.push(
			svgText({ x: centerX, y: plotBottom + 16, text: line1, fill: palette.axis, size: 9.5, anchor: "middle" })
		);
		if (line2) {
			parts.push(
				svgText({
					x: centerX,
					y: plotBottom + 27,
					text: line2,
					fill: palette.axis,
					size: 9.5,
					anchor: "middle"
				})
			);
		}
	});

	const legend = svgLegend({
		items: series.map(item => ({ label: item.label, color: item.color })),
		x: plotLeft,
		y: height + 6,
		maxWidth: plotWidth,
		textFill: palette.brand.foreground
	});

	return svgDocument({
		width,
		height: height + legend.height + 6,
		background: palette.brand.surface,
		title: title ?? "Grouped domain bars",
		body: parts.join("") + legend.markup
	});
}
