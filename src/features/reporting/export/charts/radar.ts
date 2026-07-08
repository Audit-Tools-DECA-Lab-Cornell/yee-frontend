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
	const { series, axisLabels, palette, size = 420, title } = options;
	const center = size / 2;
	// A smaller inner pad keeps the plotted polygon large; horizontal room for the
	// axis labels comes from the side gutters below (which scale to the longest
	// label) rather than from shrinking the radius.
	const radius = center - 58;
	// Side gutters so start/end-anchored axis labels never clip the canvas edge.
	const longestLabel = axisLabels.reduce((max, label) => Math.max(max, label.length), 0);
	const hGutter = Math.min(150, Math.max(64, Math.round(longestLabel * 6.4)));
	const width = size + hGutter * 2;
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

	// Numeric ring labels along the top (12 o'clock) spoke so the distance of each
	// vertex from center reads as an actual percentage, not just a shape. The
	// outermost ring is skipped: its label would sit on the chart edge, colliding
	// with the top axis label and the 100%-value vertex dot.
	for (const ring of RING_VALUES) {
		if (ring >= 100) continue;
		const point = radarRadialPoint(0, total, ring, radius, center);
		parts.push(
			svgText({
				x: center - 5,
				y: point.y + 3,
				text: `${ring}`,
				fill: palette.axis,
				size: 8,
				anchor: "end",
				opacity: 0.65
			})
		);
	}

	// Spokes + axis labels.
	axisLabels.forEach((label, index) => {
		const outer = radarRadialPoint(index, total, 100, radius, center);
		parts.push(svgLine(center, center, outer.x, outer.y, palette.grid, { width: 1 }));
		const labelPoint = radarRadialPoint(index, total, 118, radius, center);
		const anchor = labelPoint.x < center - 1 ? "end" : labelPoint.x > center + 1 ? "start" : "middle";
		parts.push(
			svgText({
				x: labelPoint.x,
				y: labelPoint.y + 3,
				text: label,
				fill: palette.axis,
				size: 11.5,
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

	// The square chart is drawn in 0…size coordinates, then shifted right by the
	// gutter so the wider canvas gives the side labels room on both edges.
	const chart = `<g transform="translate(${hGutter},0)">${parts.join("")}</g>`;

	const legend = svgLegend({
		items: series.map(item => ({ label: item.label, color: item.color })),
		x: 12,
		y: size + 16,
		maxWidth: width - 24,
		textFill: palette.brand.foreground
	});

	return svgDocument({
		width,
		height: size + legend.height + 8,
		background: palette.brand.surface,
		title: title ?? "Domain profile radar",
		body: chart + legend.markup
	});
}
