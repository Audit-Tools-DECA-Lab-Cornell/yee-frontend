/**
 * Radar / spider chart builder — standalone SVG.
 *
 * One builder covers all three uses: a single-audit domain profile (R1, one
 * polygon), a places overlay (R2), and an audit overlay (R4). Geometry is the
 * shared `radarRadialPoint`/`radarPolygonPoints` used by the on-screen chart, so
 * the export can never drift from the screen (D3).
 */
import type { ExportPalette } from "../types";
import { radarPolygonPoints, radarRadialPoint, round } from "./geometry";
import { svgDocument, svgLegend, svgLine, svgPolygon, svgText } from "./svg-primitives";

export type RadarSeries = {
	label: string;
	color: string;
	/** One value per axis, 0–100, in axis order. */
	values: number[];
};

const RING_VALUES = [25, 50, 75, 100];

export function buildRadarSvg(options: {
	series: RadarSeries[];
	axisLabels: string[];
	palette: ExportPalette;
	size?: number;
	title?: string;
}): string {
	const { series, axisLabels, palette, size = 380, title } = options;
	const center = size / 2;
	const radius = center - 78; // leave room for axis labels
	const total = axisLabels.length;
	const parts: string[] = [];

	// Concentric rings.
	for (const ring of RING_VALUES) {
		const ringPoints = axisLabels
			.map((_, index) => {
				const point = radarRadialPoint(index, total, ring, radius, center);
				return `${round(point.x)},${round(point.y)}`;
			})
			.join(" ");
		parts.push(
			`<polygon points="${ringPoints}" fill="none" stroke="${palette.grid}" stroke-width="1" stroke-dasharray="3 3" />`
		);
	}

	// Spokes + axis labels.
	axisLabels.forEach((label, index) => {
		const outer = radarRadialPoint(index, total, 100, radius, center);
		parts.push(svgLine(center, center, outer.x, outer.y, palette.grid, { width: 1 }));
		const labelPoint = radarRadialPoint(index, total, 122, radius, center);
		const anchor = labelPoint.x < center - 1 ? "end" : labelPoint.x > center + 1 ? "start" : "middle";
		parts.push(
			svgText({
				x: labelPoint.x,
				y: labelPoint.y + 3,
				text: label,
				fill: palette.axis,
				size: 11,
				weight: 500,
				anchor
			})
		);
	});

	// Series polygons (draw fills first, then outlines on top for legibility).
	for (const item of series) {
		const points = radarPolygonPoints(item.values, radius, center);
		parts.push(svgPolygon(points, { fill: item.color, fillOpacity: 0.14, stroke: item.color, strokeWidth: 2.25 }));
	}
	// Vertex dots.
	for (const item of series) {
		item.values.forEach((value, index) => {
			const point = radarRadialPoint(index, total, value, radius, center);
			parts.push(`<circle cx="${round(point.x)}" cy="${round(point.y)}" r="2.5" fill="${item.color}" />`);
		});
	}

	const legend = svgLegend({
		items: series.map(item => ({ label: item.label, color: item.color })),
		x: 12,
		y: size + 16,
		maxWidth: size - 24,
		textFill: palette.brand.foreground
	});

	return svgDocument({
		width: size,
		height: size + legend.height + 8,
		background: palette.brand.surface,
		title: title ?? "Domain profile radar",
		body: parts.join("") + legend.markup
	});
}
