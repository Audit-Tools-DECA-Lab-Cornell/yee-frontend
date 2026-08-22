import * as React from "react";

import { yeeDomainThemes } from "@/features/yee-audit/config/yee-domain-theme";
import type { YeeDomainKey } from "@/features/yee-audit/config/yee-audit-config";
import { cn } from "@/lib/utils";

/**
 * The two shapes a domain is allowed to take anywhere in the app.
 *
 * Before this existed, every table, chip and legend hand-rolled its own inline
 * `style={{ backgroundColor: theme.lightHex, ... }}`, and the ones that didn't
 * bother just rendered the domain in grey. Both are now a bug: if a surface
 * names a domain, it renders it through one of these, and the colours come from
 * `yeeDomainThemes` → `--domain-*` → `src/styles/domain-palette.json`.
 *
 * Colour is never the only signal — both shapes always carry the domain's name
 * (or, for the dot, sit beside it), which is what WCAG 1.4.1 asks for.
 */

/** A small filled dot, for use immediately before a domain's name. */
export function DomainDot({ domain, className }: { domain: YeeDomainKey; className?: string }) {
	return (
		<span
			aria-hidden
			className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", className)}
			style={{ backgroundColor: yeeDomainThemes[domain].strongHex }}
		/>
	);
}

/**
 * A pill carrying the domain's name on its own tint.
 *
 * `text` (not `strong`) paints the label: on the `light` tint it clears 7:1,
 * where `strong` would only reach ~4.5:1 — fine for a border, tight for a
 * 12px label.
 */
export function DomainBadge({
	domain,
	label,
	className
}: {
	domain: YeeDomainKey;
	/** Defaults to the theme's own label; pass one to override the wording. */
	label?: React.ReactNode;
	className?: string;
}) {
	const theme = yeeDomainThemes[domain];
	return (
		<span
			className={cn("inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium", className)}
			style={{
				borderColor: theme.strongHex,
				backgroundColor: theme.lightHex,
				color: theme.textHex
			}}>
			{label ?? theme.label}
		</span>
	);
}

/** A domain's name in its own colour, with the dot — the default inline treatment. */
export function DomainLabel({
	domain,
	label,
	className
}: {
	domain: YeeDomainKey;
	label?: React.ReactNode;
	className?: string;
}) {
	const theme = yeeDomainThemes[domain];
	return (
		<span className={cn("flex items-center gap-2.5 font-medium", className)} style={{ color: theme.textHex }}>
			<DomainDot domain={domain} />
			{label ?? theme.label}
		</span>
	);
}
