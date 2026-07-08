/**
 * Trend line chart builder — standalone SVG. Raw % and Youth-Weighted % lines
 * across a place's audits over time (R3). Series colors match the on-screen
 * chart: weighted = series 1 (brand green), raw = series 2 (blue).
 */
import type { ExportPalette } from "../types";
import { round, trendScale } from "./geometry";
import { svgDocument, svgLegend, svgLine, svgPolyline, svgText } from "./svg-primitives";

export type TrendPoint = {
	label: string;
	rawPercent: number;
	weightedPercent: number;
};

const GRID_VALUES = [0, 25, 50, 75, 100];

export function buildTrendSvg(options: {
	points: TrendPoint[];
	palette: ExportPalette;
	width?: number;
	height?: number;
	title?: string;
}): string {
	const { points, palette, width = 760, height = 340, title } = options;
	const padding = 44;
	const plotBottom = height - 52; // extra room for x labels
	const scale = trendScale({ count: points.length, width, height: plotBottom + padding, padding });
	const rawColor = palette.chartSeries[1];
	const weightedColor = palette.chartSeries[0];
	const parts: string[] = [];

	// Horizontal gridlines + y labels.
	for (const value of GRID_VALUES) {
		const y = scale.pointY(value);
		parts.push(svgLine(padding, y, width - padding, y, palette.grid, { width: 1, dash: "3 3" }));
		parts.push(
			svgText({ x: padding - 8, y: y + 4, text: `${value}%`, fill: palette.axis, size: 10, anchor: "end" })
		);
	}

	const rawPolyline = points
		.map((point, index) => `${round(scale.pointX(index))},${round(scale.pointY(point.rawPercent))}`)
		.join(" ");
	const weightedPolyline = points
		.map((point, index) => `${round(scale.pointX(index))},${round(scale.pointY(point.weightedPercent))}`)
		.join(" ");
	parts.push(svgPolyline(rawPolyline, rawColor, 2.5));
	parts.push(svgPolyline(weightedPolyline, weightedColor, 2.5));

	// Vertex dots + x labels.
	points.forEach((point, index) => {
		const x = scale.pointX(index);
		parts.push(
			`<circle cx="${round(x)}" cy="${round(scale.pointY(point.rawPercent))}" r="3" fill="${rawColor}" />`
		);
		parts.push(
			`<circle cx="${round(x)}" cy="${round(scale.pointY(point.weightedPercent))}" r="3" fill="${weightedColor}" />`
		);
		parts.push(
			svgText({ x, y: plotBottom + 20, text: point.label, fill: palette.axis, size: 9.5, anchor: "middle" })
		);
	});

	const legend = svgLegend({
		items: [
			{ label: "Raw Score %", color: rawColor },
			{ label: "Youth Weighted Average %", color: weightedColor }
		],
		x: padding,
		y: height + 6,
		maxWidth: width - padding * 2,
		textFill: palette.brand.foreground
	});

	return svgDocument({
		width,
		height: height + legend.height + 6,
		background: palette.brand.surface,
		title: title ?? "Trend over time",
		body: parts.join("") + legend.markup
	});
}
