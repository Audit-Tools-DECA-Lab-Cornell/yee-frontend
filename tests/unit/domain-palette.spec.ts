/**
 * Guard tests for the domain colour palette.
 *
 * These are what make "the palette is centralised" an enforced property rather
 * than a convention. Four things are checked:
 *
 *   1. globals.css is exactly what the generator produces from the spec, so a
 *      hand-edited `--domain-*` token cannot land.
 *   2. Every role clears the WCAG contrast floor it is used at.
 *   3. The six chart fills stay distinguishable, in full colour and under the
 *      two common colour-vision deficiencies.
 *   4. The spec has not been edited without its checksum being refreshed (which
 *      is the prompt to make the same paired edit in yee-mobile), and no domain
 *      hex is hardcoded anywhere else in src/.
 */
import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
	DOMAIN_CONTRAST_FLOORS,
	DOMAIN_PALETTE_CHECKSUM,
	DOMAIN_SURFACES,
	domainPalette,
	domainPaletteOrder,
	domainTokenSlugs,
	type DomainMode,
	type DomainPaletteKey
} from "../../src/styles/domain-palette";

const ROOT = resolve(__dirname, "../..");
const SPEC_PATH = resolve(ROOT, "src/styles/domain-palette.json");

/* ── colour maths ─────────────────────────────────────────────────────────── */

const channels = (hex: string) => [0, 2, 4].map(i => Number.parseInt(hex.replace("#", "").slice(i, i + 2), 16) / 255);

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function relativeLuminance(hex: string): number {
	const [r, g, b] = channels(hex).map(toLinear);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio. */
function contrast(a: string, b: string): number {
	const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

function oklab(hex: string): [number, number, number] {
	const [r, g, b] = channels(hex).map(toLinear);
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
	];
}

/** Machado–Oliveira–Fernandes (2009) CVD simulation at severity 1.0. */
const CVD_MATRICES = {
	protan: [
		[0.152286, 1.052583, -0.204868],
		[0.114503, 0.786281, 0.099216],
		[-0.003882, -0.048116, 1.051998]
	],
	deutan: [
		[0.367322, 0.860646, -0.227968],
		[0.280085, 0.672501, 0.047413],
		[-0.01182, 0.04294, 0.968881]
	],
	tritan: [
		[1.255528, -0.076749, -0.178779],
		[-0.078411, 0.930809, 0.147602],
		[0.004733, 0.691367, 0.3039]
	]
} as const;

function simulate(hex: string, kind: keyof typeof CVD_MATRICES): [number, number, number] {
	const [r, g, b] = channels(hex).map(toLinear);
	const m = CVD_MATRICES[kind];
	const clamp = (c: number) => Math.max(0, Math.min(1, c));
	return [
		clamp(m[0][0] * r + m[0][1] * g + m[0][2] * b),
		clamp(m[1][0] * r + m[1][1] * g + m[1][2] * b),
		clamp(m[2][0] * r + m[2][1] * g + m[2][2] * b)
	];
}

function oklabFromLinear([r, g, b]: [number, number, number]): [number, number, number] {
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
	];
}

/** Euclidean distance in OKLab ×100 — the separation metric the palette is tuned to. */
function deltaE(a: string, b: string, kind?: keyof typeof CVD_MATRICES): number {
	const [l1, a1, b1] = kind ? oklabFromLinear(simulate(a, kind)) : oklab(a);
	const [l2, a2, b2] = kind ? oklabFromLinear(simulate(b, kind)) : oklab(b);
	return 100 * Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

const MODES: DomainMode[] = ["light", "dark"];

/* ── 1. the CSS is generated, not hand-written ────────────────────────────── */

test("globals.css matches what the generator produces from the spec", () => {
	// Runs the real generator in --check mode. If someone edits a `--domain-*`
	// value in globals.css directly, this exits non-zero and the test fails.
	expect(() =>
		execFileSync("node", ["scripts/generate-domain-tokens.mjs", "--check"], {
			cwd: ROOT,
			stdio: "pipe"
		})
	).not.toThrow();
});

test("every domain token in globals.css carries the spec's value", () => {
	const css = readFileSync(resolve(ROOT, "src/app/globals.css"), "utf8");
	for (const domain of domainPaletteOrder) {
		const slug = domainTokenSlugs[domain];
		for (const [role, value] of Object.entries(domainPalette.light[domain])) {
			expect(css, `--domain-${slug}-${role}`).toContain(`--domain-${slug}-${role}: ${value};`);
		}
	}
});

/* ── 2. WCAG contrast, per role, per mode ─────────────────────────────────── */

for (const mode of MODES) {
	const surfaces = DOMAIN_SURFACES[mode];

	test(`[${mode}] text and strong stay readable on the card, the app bg and their own tint`, () => {
		for (const domain of domainPaletteOrder) {
			const colors = domainPalette[mode][domain];
			for (const role of ["text", "strong"] as const) {
				const floor = DOMAIN_CONTRAST_FLOORS[role];
				for (const [name, against] of Object.entries({
					card: surfaces.card,
					app: surfaces.app,
					tint: colors.light
				})) {
					const ratio = contrast(colors[role], against);
					expect(
						ratio,
						`${domain}.${role} (${colors[role]}) on ${name} (${against}) = ${ratio.toFixed(2)}:1`
					).toBeGreaterThanOrEqual(floor);
				}
			}
		}
	});

	test(`[${mode}] chart fills clear WCAG 1.4.11 non-text contrast on the card`, () => {
		for (const domain of domainPaletteOrder) {
			const { fill } = domainPalette[mode][domain];
			const ratio = contrast(fill, surfaces.card);
			expect(
				ratio,
				`${domain}.fill (${fill}) on ${surfaces.card} = ${ratio.toFixed(2)}:1`
			).toBeGreaterThanOrEqual(DOMAIN_CONTRAST_FLOORS.fill);
		}
	});

	/* ── 3. the six fills stay tellable apart ─────────────────────────────── */

	test(`[${mode}] adjacent chart fills stay separable, including under CVD`, () => {
		for (let i = 1; i < domainPaletteOrder.length; i++) {
			const previous = domainPalette[mode][domainPaletteOrder[i - 1]].fill;
			const current = domainPalette[mode][domainPaletteOrder[i]].fill;
			const pair = `${domainPaletteOrder[i - 1]} ↔ ${domainPaletteOrder[i]}`;

			// Full-colour vision: below 15 and neighbours are hard to tell apart.
			expect(deltaE(previous, current), `${pair} (normal vision)`).toBeGreaterThanOrEqual(15);

			// Protanopia and deuteranopia — between them ~8% of men — are the gated
			// pair, at the ΔE 8 target. Tritanopia is not gated: it is orders of
			// magnitude rarer, and every domain mark in the app is directly labelled,
			// so identity never rests on the hue alone (WCAG 1.4.1).
			for (const kind of ["protan", "deutan"] as const) {
				expect(deltaE(previous, current, kind), `${pair} (${kind})`).toBeGreaterThanOrEqual(8);
			}
		}
	});
}

/* ── 4. one spec, and nothing hardcoded ───────────────────────────────────── */

/**
 * Stable, formatting-independent serialization of the spec: keys sorted, no
 * whitespace. The two repos format JSON differently, so the guard has to compare
 * CONTENT — a raw byte hash would fail on a formatter run while the colours were
 * still identical.
 */
function canonical(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonical);
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.keys(value as Record<string, unknown>)
				.sort()
				.map(key => [key, canonical((value as Record<string, unknown>)[key])])
		);
	}
	return value;
}

/**
 * What this catches, precisely: the spec being edited without the checksum being
 * updated. That is the careless case — a hand-tweaked hex here would fail the
 * build until someone consciously refreshed the constant, at which point the
 * failure message tells them the other repo needs the same two edits.
 *
 * What it CANNOT catch, on its own: this test reads only this repo's spec and
 * this repo's constant, so updating both together passes here regardless of what
 * yee-mobile holds. The pairing rests on `DOMAIN_PALETTE_CHECKSUM` being the same
 * literal in both repos and on both PRs landing together. Genuinely proving it
 * would need cross-repo CI that fetches yee-mobile's copy and compares — worth
 * doing if these two ever drift in practice.
 */
test("the spec has not changed without its checksum being updated", () => {
	const digest = createHash("sha256")
		.update(JSON.stringify(canonical(JSON.parse(readFileSync(SPEC_PATH, "utf8")))))
		.digest("hex");
	expect(
		digest,
		"domain-palette.json changed. This must be a paired edit: copy its contents to " +
			"yee-mobile/lib/domain-palette.json, set DOMAIN_PALETTE_CHECKSUM to the new digest in " +
			"BOTH repos, regenerate the web's CSS tokens, and re-run the guard tests on both sides. " +
			"Nothing here can see yee-mobile, so landing only one side will not fail this test."
	).toBe(DOMAIN_PALETTE_CHECKSUM);
});

test("no domain colour is hardcoded outside the spec", () => {
	const every = MODES.flatMap(mode =>
		domainPaletteOrder.flatMap(domain => Object.values(domainPalette[mode][domain]))
	).map(hex => hex.toLowerCase());

	// Search the tracked source, minus the spec itself (which is where they belong).
	// The spec holds the values by definition, and globals.css is generated FROM it
	// (kept honest by the --check test above); everything else must go through a token.
	const generated = ["src/styles/domain-palette.json", "src/app/globals.css"];
	const tracked = execFileSync("git", ["ls-files", "src", "scripts"], { cwd: ROOT, encoding: "utf8" })
		.split("\n")
		.filter(file => file && !generated.includes(file) && existsSync(resolve(ROOT, file)));

	const offenders: string[] = [];
	for (const file of tracked) {
		const contents = readFileSync(resolve(ROOT, file), "utf8").toLowerCase();
		for (const hex of every) {
			if (contents.includes(hex)) offenders.push(`${file} contains ${hex}`);
		}
	}
	expect(
		offenders,
		"Domain colours must be referenced via var(--domain-*) or the shared palette module, never inlined."
	).toEqual([]);
});

test("every domain resolves all four roles in both modes", () => {
	for (const mode of MODES) {
		for (const domain of domainPaletteOrder as DomainPaletteKey[]) {
			const colors = domainPalette[mode][domain];
			for (const role of ["text", "strong", "fill", "light"] as const) {
				expect(colors[role], `${mode}.${domain}.${role}`).toMatch(/^#[0-9a-f]{6}$/);
			}
		}
	}
});
