/**
 * The domain colour palette, read from the canonical spec.
 *
 * `src/styles/domain-palette.json` is THE source of truth for every YEE domain
 * colour in this repo — the `--domain-*` CSS custom properties, the Tailwind
 * `domain-*` utilities built on them, and the hex values the PDF/Excel/SVG
 * export layer paints with. The same file is committed byte-for-byte in
 * yee-mobile (`lib/domain-palette.json`); `DOMAIN_PALETTE_CHECKSUM` below is
 * asserted in both repos so the two copies cannot drift apart unnoticed.
 *
 * Never hardcode a domain colour anywhere else. To change one:
 *   1. edit the JSON (in BOTH repos),
 *   2. run `node scripts/generate-domain-tokens.mjs` to rewrite globals.css,
 *   3. update `DOMAIN_PALETTE_CHECKSUM` here and in yee-mobile,
 *   4. run the palette guard tests in both repos — they re-check every WCAG
 *      contrast gate and the categorical separation of the chart fills.
 */
import spec from "@/styles/domain-palette.json";

/**
 * The four roles each domain carries. The split exists because one hue cannot
 * be readable text AND a legible chart fill: `text`/`strong` are dark enough to
 * carry type, `fill` is vivid enough to read as a chart mark.
 */
export type DomainRole = "text" | "strong" | "fill" | "light";

/** Light is the web app's only theme today; `dark` is consumed by yee-mobile. */
export type DomainMode = "light" | "dark";

/** Derived from the spec's own colour map, so a new domain is a compile error everywhere. */
export type DomainPaletteKey = keyof typeof spec.light;

export type DomainRoleColors = Readonly<Record<DomainRole, string>>;

/** Canonical domain order — audit step order, and the order charts assign in. */
export const domainPaletteOrder = spec.order as readonly DomainPaletteKey[];

/** `DomainPaletteKey` → the `--domain-<slug>-*` prefix used in globals.css. */
export const domainTokenSlugs = Object.fromEntries(
	domainPaletteOrder.map(key => [key, spec.domains[key].slug])
) as Record<DomainPaletteKey, string>;

/** Human-readable domain names, used by the token generator and the guard tests. */
export const domainPaletteLabels = Object.fromEntries(
	domainPaletteOrder.map(key => [key, spec.domains[key].label])
) as Record<DomainPaletteKey, string>;

/** Every resolved colour, by mode then domain then role. */
export const domainPalette: Readonly<Record<DomainMode, Record<DomainPaletteKey, DomainRoleColors>>> = {
	light: spec.light,
	dark: spec.dark
};

/** Shorthand for the web app's active (light) theme. */
export const lightDomainPalette = domainPalette.light;

/**
 * SHA-256 of the spec's CONTENT — keys sorted, whitespace stripped — asserted in
 * both repos. Content rather than raw bytes because the two repos format JSON
 * differently (tabs here, four spaces there), so a byte hash would break on a
 * formatter run while the colours were still identical. What must never drift
 * is the values; this catches exactly that.
 */
export const DOMAIN_PALETTE_CHECKSUM = "9adf1321e741a31b963b4ec71885950e6a99893140d90e2cf8c15ba7512a2553";

/**
 * The contrast floors every generated colour is held to, in the guard tests and
 * in the generator. `text`/`strong` must clear their floor against the card,
 * the app background AND their own `light` tint, so either is safe wherever it
 * lands; `fill` only ever paints a mark, so it takes WCAG 1.4.11's 3:1.
 */
export const DOMAIN_CONTRAST_FLOORS: Readonly<Record<Exclude<DomainRole, "light">, number>> = {
	text: 7,
	strong: 4.5,
	fill: 3
};

/** Surfaces the floors above are measured against, per mode. */
export const DOMAIN_SURFACES: Readonly<Record<DomainMode, { card: string; app: string }>> = {
	light: { card: "#ffffff", app: "#f7f8f9" },
	dark: { card: "#1E201C", app: "#141513" }
};

/** Resolve one domain's colours. Defaults to the web app's light theme. */
export function getDomainColors(domain: DomainPaletteKey, mode: DomainMode = "light"): DomainRoleColors {
	return domainPalette[mode][domain];
}

/** The `var(--domain-*)` reference for a role — for inline styles and SVG. */
export function domainVar(domain: DomainPaletteKey, role: DomainRole): string {
	return `var(--domain-${domainTokenSlugs[domain]}-${role})`;
}
