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
import { lightDomainPalette, type DomainPaletteKey } from "@/styles/domain-palette";
import { scoreBandKey } from "@/lib/score-band";
import { domainOrder, type ExportPalette } from "./types";

/**
 * Fallback hex table for the NON-domain tokens — mirrors the `oklch()` values in
 * `src/app/globals.css`. KEEP IN SYNC: if you change a `--chart-series-*`,
 * `--score-*`, `--chart-grid/axis`, `--yee-green-*`, `--foreground`,
 * `--muted-foreground`, `--border` or `--card` token there, recompute the hex
 * here. Used only when the browser cannot resolve the live token; a Playwright
 * check compares the two.
 *
 * Domain colours are deliberately NOT in this table: they come straight from
 * `src/styles/domain-palette.json` (via `lightDomainPalette`), the same spec
 * that generates the `--domain-*` tokens, so an export can never paint a domain
 * differently from the screen.
 */
const FALLBACK_HEX = {
	"chart-series-1": "#1a6444",
	"chart-series-2": "#347a9f",
	"chart-series-3": "#a67537",
	"chart-series-4": "#7b63a3",
	"chart-series-5": "#9f5b5c",
	"score-high": "#166534",
	"score-high-bg": "#dcfce7",
	"score-mid": "#854d0e",
	"score-mid-bg": "#fef9c3",
	"score-low": "#991b1b",
	"score-low-bg": "#fee2e2",
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

	// Detect a rejected color (e.g. `oklch(...)` on an engine that lacks it) by
	// reading `fillStyle` back: the browser normalizes an accepted value but
	// leaves a rejected one at the prior sentinel. Without this, a rejected color
	// would silently paint the previous pixel and we'd cache the wrong hex instead
	// of falling back to the literal table.
	context.clearRect(0, 0, 1, 1);
	context.fillStyle = "#010203";
	const sentinel = context.fillStyle;
	context.fillStyle = trimmed;
	if (context.fillStyle === sentinel) return null;
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
 * Domain colours skip the DOM round-trip entirely: the spec already stores plain
 * hex, and it is the same file the `--domain-*` tokens are generated from, so
 * reading it directly is both exact and available without a document.
 */
function readDomains(): ExportPalette["domains"] {
	return Object.fromEntries(
		domainOrder.map(domain => [domain, { ...lightDomainPalette[domain as DomainPaletteKey] }])
	) as ExportPalette["domains"];
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

	return {
		domains: readDomains(),
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

/**
 * Score-band selector for the export pipeline. Delegates to the app's
 * `scoreBandKey` so the exported PDF/XLSX bands can never drift from the
 * on-screen ones — the 34/67 cutoffs live in `@/lib/score-band` only.
 */
export function bandForPercent(percent: number): "low" | "mid" | "high" {
	return scoreBandKey(percent);
}
