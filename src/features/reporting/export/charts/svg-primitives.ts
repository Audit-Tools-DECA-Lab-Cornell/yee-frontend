/**
 * Primitives for assembling STANDALONE SVG strings — every element carries
 * inline presentation attributes (`fill="#2f6f4f"`), explicit `font-family`, and
 * no CSS classes or `var(--…)` tokens, so the string renders identically outside
 * the DOM (rasterized for PDF, or downloaded directly as .svg). See D3.
 */
import { round } from "./geometry";

/**
 * Font stack pinned to the app's UI font with generic fallbacks. Raster happens
 * in the user's browser (where Inter is loaded), so charts match the screen;
 * fallbacks keep a direct .svg download legible anywhere (plan appendix).
 */
export const CHART_FONT_FAMILY =
	"Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Escape a string for safe inclusion in SVG text / attribute values. */
export function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

export type TextOptions = {
	x: number;
	y: number;
	text: string;
	fill: string;
	size?: number;
	weight?: number | string;
	anchor?: "start" | "middle" | "end";
	opacity?: number;
};

export function svgText(options: TextOptions): string {
	const { x, y, text, fill, size = 12, weight = 400, anchor = "start", opacity } = options;
	const opacityAttr = opacity === undefined ? "" : ` opacity="${opacity}"`;
	return (
		`<text x="${round(x)}" y="${round(y)}" fill="${fill}" font-size="${size}" font-weight="${weight}" ` +
		`font-family="${CHART_FONT_FAMILY}" text-anchor="${anchor}"${opacityAttr}>${escapeXml(text)}</text>`
	);
}

export function svgLine(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	stroke: string,
	options: { width?: number; dash?: string; opacity?: number } = {}
): string {
	const { width = 1, dash, opacity } = options;
	const dashAttr = dash ? ` stroke-dasharray="${dash}"` : "";
	const opacityAttr = opacity === undefined ? "" : ` stroke-opacity="${opacity}"`;
	return `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" stroke="${stroke}" stroke-width="${width}"${dashAttr}${opacityAttr} />`;
}

export function svgRect(
	x: number,
	y: number,
	width: number,
	height: number,
	fill: string,
	options: { rx?: number; stroke?: string; strokeWidth?: number; opacity?: number } = {}
): string {
	const { rx, stroke, strokeWidth, opacity } = options;
	const rxAttr = rx ? ` rx="${rx}"` : "";
	const strokeAttr = stroke ? ` stroke="${stroke}" stroke-width="${strokeWidth ?? 1}"` : "";
	const opacityAttr = opacity === undefined ? "" : ` fill-opacity="${opacity}"`;
	return `<rect x="${round(x)}" y="${round(y)}" width="${round(width)}" height="${round(height)}" fill="${fill}"${rxAttr}${strokeAttr}${opacityAttr} />`;
}

export function svgCircle(cx: number, cy: number, r: number, fill: string): string {
	return `<circle cx="${round(cx)}" cy="${round(cy)}" r="${r}" fill="${fill}" />`;
}

export function svgPolygon(
	points: string,
	options: { fill: string; stroke?: string; strokeWidth?: number; fillOpacity?: number }
): string {
	const { fill, stroke, strokeWidth = 2, fillOpacity } = options;
	const strokeAttr = stroke ? ` stroke="${stroke}" stroke-width="${strokeWidth}"` : "";
	const opacityAttr = fillOpacity === undefined ? "" : ` fill-opacity="${fillOpacity}"`;
	return `<polygon points="${points}" fill="${fill}"${strokeAttr}${opacityAttr} stroke-linejoin="round" />`;
}

export function svgPolyline(points: string, stroke: string, width: number): string {
	return `<polyline points="${points}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round" />`;
}

export type LegendItem = { label: string; color: string };

/**
 * A horizontal wrapping legend of colored swatches. Returns the SVG fragment and
 * the total height consumed, so callers can size the chart below it.
 */
export function svgLegend(options: {
	items: LegendItem[];
	x: number;
	y: number;
	maxWidth: number;
	textFill: string;
	fontSize?: number;
}): { markup: string; height: number } {
	const { items, x, y, maxWidth, textFill, fontSize = 12 } = options;
	const swatch = 10;
	const gap = 6;
	const itemGap = 18;
	const lineHeight = 20;
	const approxCharWidth = fontSize * 0.6;

	const parts: string[] = [];
	let cursorX = x;
	let cursorY = y;
	for (const item of items) {
		const itemWidth = swatch + gap + item.label.length * approxCharWidth + itemGap;
		if (cursorX + itemWidth > x + maxWidth && cursorX > x) {
			cursorX = x;
			cursorY += lineHeight;
		}
		parts.push(svgRect(cursorX, cursorY - swatch, swatch, swatch, item.color, { rx: 2 }));
		parts.push(
			svgText({
				x: cursorX + swatch + gap,
				y: cursorY,
				text: item.label,
				fill: textFill,
				size: fontSize
			})
		);
		cursorX += itemWidth;
	}
	return { markup: parts.join(""), height: cursorY - y + lineHeight };
}

/** Wrap chart content in a complete, self-describing SVG document. */
export function svgDocument(options: {
	width: number;
	height: number;
	body: string;
	background?: string;
	title?: string;
}): string {
	const { width, height, body, background, title } = options;
	const bg = background ? svgRect(0, 0, width, height, background) : "";
	const titleEl = title ? `<title>${escapeXml(title)}</title>` : "";
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
		`viewBox="0 0 ${width} ${height}" role="img">${titleEl}${bg}${body}</svg>`
	);
}
