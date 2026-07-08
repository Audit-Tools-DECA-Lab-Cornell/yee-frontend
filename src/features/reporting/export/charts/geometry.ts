/**
 * Pure chart geometry — the ONE source of the point/polygon/scale math shared
 * by the on-screen React charts (`live-reports.tsx`) and the export SVG builders
 * (`radar.ts`/`trend.ts`/`domain-bars.ts`/`grouped-bars.ts`).
 *
 * Zero dependencies (no jspdf, no palette): safe to import statically into the
 * dashboard bundle. Sharing this math is what keeps the exported charts numeric-
 * ally identical to what the user saw on screen (implementation-plan D3/M1).
 */

export function clampPercent(value: number): number {
	return Math.max(0, Math.min(100, value));
}

/** Polar point for a radar vertex: `index` of `total` spokes, `value` in 0–100. */
export function radarRadialPoint(
	index: number,
	total: number,
	value: number,
	radius: number,
	center: number
): { x: number; y: number } {
	const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
	const scaledRadius = radius * (value / 100);
	return {
		x: center + Math.cos(angle) * scaledRadius,
		y: center + Math.sin(angle) * scaledRadius
	};
}

/** `"x,y x,y …"` polygon points for a radar series (one value per spoke, 0–100). */
export function radarPolygonPoints(values: number[], radius: number, center: number): string {
	return values
		.map((value, index) => {
			const point = radarRadialPoint(index, values.length, value, radius, center);
			return `${round(point.x)},${round(point.y)}`;
		})
		.join(" ");
}

export type TrendScale = {
	pointX: (index: number) => number;
	pointY: (value: number) => number;
};

/** Linear x-by-index / y-by-percent scale for the trend line chart. */
export function trendScale(options: {
	count: number;
	width: number;
	height: number;
	padding: number;
}): TrendScale {
	const { count, width, height, padding } = options;
	const xStep = count > 1 ? (width - padding * 2) / (count - 1) : 0;
	return {
		pointX: index => padding + index * xStep,
		pointY: value => height - padding - ((height - padding * 2) * clampPercent(value)) / 100
	};
}

/** Round to 2dp for compact, stable SVG coordinate strings. */
export function round(value: number): number {
	return Math.round(value * 100) / 100;
}
