/**
 * D4 — the color pipeline. One module resolves every CSS color token the app
 * uses into a plain hex string that jsPDF / autotable / xlsx-js-style / the SVG
 * chart builders can consume. `globals.css` stays the single source of truth;
 * drift risk is confined to the FALLBACK_HEX table below.
 *
 * Why this exists: the on-screen charts reference `var(--chart-series-1)` etc.,
 * and the tokens are `oklch(...)` values jsPDF cannot use. `getExportPalette()`
 * reads the live computed values off `document.documentElement` and rasterizes
 * each through a 1x1 canvas to a hex; when there is no DOM (unit tests / SSR) or
 * resolution fails, it falls back to the literal table.
 */
import { domainOrder, type ExportPalette, type YeeDomainKey } from "./types";

/**
 * Fallback hex table — mirrors the `oklch()` tokens in `src/app/globals.css`.
 * KEEP IN SYNC: if you change a `--domain-*`, `--chart-series-*`, `--score-*`,
 * `--chart-grid/axis`, `--yee-green-*`, `--foreground`, `--muted-foreground`,
 * `--border`, or `--card` token there, recompute the hex here (see
 * `scripts`/the oklch→sRGB conversion in the export docs). Used only when the
 * browser cannot resolve the live token; a Playwright check compares the two.
 */
const FALLBACK_HEX = {
	"domain-access-text": "#184b31",
	"domain-access-strong": "#2b7a52",
	"domain-access-fill": "#56ad7e",
	"domain-access-light": "#e1f4e8",
	"domain-activity-text": "#204263",
	"domain-activity-strong": "#386ca0",
	"domain-activity-fill": "#619dda",
	"domain-activity-light": "#e2f0ff",
	"domain-amenities-text": "#5b4315",
	"domain-amenities-strong": "#906a21",
	"domain-amenities-fill": "#c99d4e",
	"domain-amenities-light": "#f9edd9",
	"domain-experience-text": "#084949",
	"domain-experience-strong": "#007979",
	"domain-experience-fill": "#39abab",
	"domain-experience-light": "#dcf4f4",
	"domain-aesthetics-text": "#6c343e",
	"domain-aesthetics-strong": "#a35764",
	"domain-aesthetics-fill": "#dc8492",
	"domain-aesthetics-light": "#ffe7ea",
	"domain-use-text": "#463968",
	"domain-use-strong": "#705f9f",
	"domain-use-fill": "#a08dd8",
	"domain-use-light": "#efebff",
	"chart-series-1": "#1a6444",
	"chart-series-2": "#347a9f",
	"chart-series-3": "#a67537",
	"chart-series-4": "#7b63a3",
	"chart-series-5": "#9f5b5c",
	"score-high": "#2b7351",
	"score-high-bg": "#def5e8",
	"score-mid": "#b18c39",
	"score-mid-bg": "#f9edd5",
	"score-low": "#b1604c",
	"score-low-bg": "#ffe8e1",
	"chart-grid": "#dbdee1",
	"chart-axis": "#6d7277",
	"yee-green-950": "#001406",
	"yee-green-900": "#001f10",
	"yee-green-700": "#224c37",
	"yee-green-50": "#f0f7f2",
	foreground: "#07090b",
	"muted-foreground": "#636a6f",
	border: "#d4d8db",
	card: "#ffffff"
} as const;

type TokenName = keyof typeof FALLBACK_HEX;

/** YeeDomainKey → the `--domain-<slug>-*` prefix used in globals.css. */
const DOMAIN_TOKEN_SLUG: Record<YeeDomainKey, string> = {
	access: "access",
	activitySpaces: "activity",
	amenities: "amenities",
	experienceOfSpace: "experience",
	aestheticsAndCare: "aesthetics",
	useAndUsability: "use"
};

const hexCache = new Map<string, string>();
let sharedCanvasContext: CanvasRenderingContext2D | null | undefined;

function getCanvasContext(): CanvasRenderingContext2D | null {
	if (sharedCanvasContext !== undefined) return sharedCanvasContext;
	if (typeof document === "undefined") {
		sharedCanvasContext = null;
		return null;
	}
	const canvas = document.createElement("canvas");
	canvas.width = 1;
	canvas.height = 1;
	sharedCanvasContext = canvas.getContext("2d", { willReadFrequently: true });
	return sharedCanvasContext;
}

function toHexChannel(value: number): string {
	return Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");
}

/**
 * Resolve any CSS color string (including `oklch(...)`, `color-mix(...)`, named
 * colors) to `#rrggbb` by painting it on a 1x1 canvas and reading the pixel.
 * Memoized per session. Returns null if there is no canvas or the value is not
 * a paintable color.
 */
export function resolveCssColorToHex(cssValue: string): string | null {
	const trimmed = cssValue.trim();
	if (!trimmed) return null;
	const cached = hexCache.get(trimmed);
	if (cached !== undefined) return cached;

	const context = getCanvasContext();
	if (!context) return null;

	// Paint over a known pixel; if the browser rejects the color, fillStyle
	// stays at the previous value and the sentinel below catches it.
	context.clearRect(0, 0, 1, 1);
	context.fillStyle = "#000000";
	context.fillStyle = trimmed;
	context.fillRect(0, 0, 1, 1);
	const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
	if (a === 0) return null;
	const hex = `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
	hexCache.set(trimmed, hex);
	return hex;
}

function readToken(styles: CSSStyleDeclaration | null, token: TokenName): string {
	if (styles) {
		const raw = styles.getPropertyValue(`--${token}`);
		const resolved = raw ? resolveCssColorToHex(raw) : null;
		if (resolved) return resolved;
	}
	return FALLBACK_HEX[token];
}

/**
 * Read every token the export layer needs off `document.documentElement`,
 * resolve each to hex, and return the typed palette. In a non-DOM context this
 * returns the full fallback table, so builders always get a complete palette.
 */
export function getExportPalette(): ExportPalette {
	const styles =
		typeof document !== "undefined" && typeof getComputedStyle === "function"
			? getComputedStyle(document.documentElement)
			: null;

	const domains = Object.fromEntries(
		domainOrder.map(domain => {
			const slug = DOMAIN_TOKEN_SLUG[domain];
			return [
				domain,
				{
					text: readToken(styles, `domain-${slug}-text` as TokenName),
					strong: readToken(styles, `domain-${slug}-strong` as TokenName),
					fill: readToken(styles, `domain-${slug}-fill` as TokenName),
					light: readToken(styles, `domain-${slug}-light` as TokenName)
				}
			];
		})
	) as ExportPalette["domains"];

	return {
		domains,
		chartSeries: [
			readToken(styles, "chart-series-1"),
			readToken(styles, "chart-series-2"),
			readToken(styles, "chart-series-3"),
			readToken(styles, "chart-series-4"),
			readToken(styles, "chart-series-5")
		],
		bands: {
			low: { fg: readToken(styles, "score-low"), bg: readToken(styles, "score-low-bg") },
			mid: { fg: readToken(styles, "score-mid"), bg: readToken(styles, "score-mid-bg") },
			high: { fg: readToken(styles, "score-high"), bg: readToken(styles, "score-high-bg") }
		},
		grid: readToken(styles, "chart-grid"),
		axis: readToken(styles, "chart-axis"),
		brand: {
			green950: readToken(styles, "yee-green-950"),
			green900: readToken(styles, "yee-green-900"),
			green700: readToken(styles, "yee-green-700"),
			green50: readToken(styles, "yee-green-50"),
			foreground: readToken(styles, "foreground"),
			muted: readToken(styles, "muted-foreground"),
			border: readToken(styles, "border"),
			surface: readToken(styles, "card")
		}
	};
}

/** Exposed for the Playwright fallback-drift check (plan risk table). */
export const FALLBACK_HEX_TABLE: Readonly<Record<string, string>> = FALLBACK_HEX;

/** Score-band selector shared with the app's `scoreBandKey` thresholds. */
export function bandForPercent(percent: number): "low" | "mid" | "high" {
	if (percent < 34) return "low";
	if (percent < 67) return "mid";
	return "high";
}
