#!/usr/bin/env node
/**
 * Rewrites the two `--domain-*` regions in `src/app/globals.css` from the
 * canonical spec (`src/styles/domain-palette.json`).
 *
 * globals.css used to carry the domain colours by hand, which meant the same
 * values lived in three places and drifted. Now the CSS is generated: edit the
 * JSON, run this, commit both. `tests/unit/domain-palette.spec.ts` re-runs the
 * generation in memory and fails if the committed CSS differs, so a hand-edit
 * inside the markers cannot survive review.
 *
 * Only the LIGHT values are emitted. The web app ships a single light theme, so
 * writing `prefers-color-scheme: dark` overrides here would repaint the domain
 * colours on an otherwise-light UI. The spec's dark ramp exists for yee-mobile,
 * which does have a dark theme, and is validated by the guard tests on both sides.
 *
 *   node scripts/generate-domain-tokens.mjs          # rewrite
 *   node scripts/generate-domain-tokens.mjs --check  # verify only, exit 1 on drift
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const CSS_PATH = resolve(here, "../src/app/globals.css");
const SPEC_PATH = resolve(here, "../src/styles/domain-palette.json");

/** Role order within each domain - stable so the generated diff stays readable. */
const ROLES = ["text", "strong", "fill", "light"];

const REGIONS = {
	theme: {
		start: "\t/* >>> generated: domain palette → Tailwind (edit domain-palette.json) <<< */",
		end: "\t/* <<< end generated: domain palette → Tailwind >>> */",
		build: buildThemeRegion
	},
	root: {
		start: "\t/* >>> generated: domain palette values (edit domain-palette.json) <<< */",
		end: "\t/* <<< end generated: domain palette values >>> */",
		build: buildRootRegion
	}
};

/** Inside `@theme inline`: expose each token to Tailwind's `domain-*` namespace. */
function buildThemeRegion(spec) {
	const lines = [
		"\t/* Every `--domain-<slug>-<role>` as a Tailwind colour, so",
		"\t   `bg-domain-access-light`, `text-domain-access-text`,",
		"\t   `border-domain-access-strong` and friends all resolve from one source. */"
	];
	for (const key of spec.order) {
		const { slug } = spec.domains[key];
		for (const role of ROLES) lines.push(`\t--color-domain-${slug}-${role}: var(--domain-${slug}-${role});`);
	}
	return lines.join("\n");
}

/** Inside `:root`: the actual values. */
function buildRootRegion(spec) {
	const lines = [
		"\t/* --- Data-viz: DOMAIN palette. Four roles per domain, each held to a WCAG",
		"\t   floor by tests/unit/domain-palette.spec.ts:",
		"\t     text   - labels/headings; >= 7:1 on the card, the app bg and its own tint",
		"\t     strong - borders/dots/rails, and small text; >= 4.5:1 on the same three",
		"\t     fill   - chart bars and score strips; >= 3:1 on the card (WCAG 1.4.11)",
		"\t     light  - the tint background the two above are measured against",
		"\t   The six fills also clear categorical colour-vision separation (OKLab ΔE >= 8",
		"\t   under protanopia and deuteranopia) so adjacent domains stay distinguishable. --- */"
	];
	for (const key of spec.order) {
		const { slug, label, hue } = spec.domains[key];
		lines.push(`\t/* ${label} - hue ${hue} */`);
		for (const role of ROLES) lines.push(`\t--domain-${slug}-${role}: ${spec.light[key][role]};`);
	}
	return lines.join("\n");
}

/** Replace both marked regions in `css`. Throws if a marker is missing. */
export function render(css, spec) {
	let out = css;
	for (const [name, region] of Object.entries(REGIONS)) {
		const startAt = out.indexOf(region.start);
		const endAt = out.indexOf(region.end);
		if (startAt === -1 || endAt === -1 || endAt < startAt) {
			throw new Error(
				`globals.css is missing the "${name}" domain-palette markers:\n${region.start}\n${region.end}`
			);
		}
		out = `${out.slice(0, startAt)}${region.start}\n${region.build(spec)}\n${region.end}${out.slice(endAt + region.end.length)}`;
	}
	return out;
}

export function readSpec() {
	return JSON.parse(readFileSync(SPEC_PATH, "utf8"));
}

export { CSS_PATH, SPEC_PATH };

// Run as a script, not when imported by the guard test.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
	const current = readFileSync(CSS_PATH, "utf8");
	const next = render(current, readSpec());
	if (process.argv.includes("--check")) {
		if (current !== next) {
			console.error("globals.css is out of date. Run: node scripts/generate-domain-tokens.mjs");
			process.exit(1);
		}
		console.log("globals.css domain tokens are up to date.");
	} else if (current === next) {
		console.log("globals.css domain tokens already up to date.");
	} else {
		writeFileSync(CSS_PATH, next);
		console.log("globals.css domain tokens regenerated.");
	}
}
