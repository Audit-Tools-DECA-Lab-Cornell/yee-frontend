"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/brand/brand-logo";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { useSidebarCollapse } from "@/components/layouts/dashboard/sidebar-collapse";
import { useWorkspaceConfig } from "@/components/layouts/dashboard/site-copy-provider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { WorkspaceVariant } from "@/components/layouts/dashboard/workspace-config";
import { cn } from "@/lib/utils";

/**
 * Collapsed, this sidebar becomes a 72px icon rail. Two rules make that work
 * without a second component:
 *
 *   - Every collapsed style is a `rail-collapsed:` variant (globals.css), which
 *     resolves in CSS from an attribute on <html>. The markup is identical in
 *     both states, so there is nothing to hydrate and nothing to shift.
 *   - Labels are hidden with `sr-only`, never `hidden`. An icon-only link with
 *     no accessible name is the classic rail regression; the label stays in the
 *     accessibility tree and the tooltip is sighted-user affordance on top.
 *
 * Row geometry is shared by every item: 44px tall always, and 44px wide when
 * collapsed — the same touch floor the header controls hold themselves to.
 */
const NAV_ROW = cn(
	"relative flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium whitespace-nowrap",
	"transition-colors focus-visible:ring-sidebar-ring focus-visible:ring-offset-sidebar",
	"rail-collapsed:w-11 rail-collapsed:justify-center rail-collapsed:gap-0 rail-collapsed:px-0"
);

/** Icons carry the whole row once labels go, so they step up 18px -> 20px. */
const NAV_ICON = "size-4.5 shrink-0 rail-collapsed:size-5";

/** Labels stay in the accessibility tree; only their pixels go away. */
const NAV_LABEL = "truncate rail-collapsed:sr-only";

/**
 * A left marker on the active row. Collapsed there is no label weight and no
 * text colour left to carry "you are here", and `--sidebar-accent` sits only
 * 0.05L above the sidebar itself — far too quiet on its own.
 */
const NAV_ACTIVE_MARKER =
	"before:absolute before:top-1/2 before:left-0 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-sidebar-primary before:content-['']";

/** Wraps a rail control in its label tooltip — only while the rail is collapsed. */
function RailTooltip({ label, enabled, children }: { label: string; enabled: boolean; children: ReactElement }) {
	if (!enabled) return children;

	return (
		<Tooltip>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent side="right" sideOffset={10}>
				{label}
			</TooltipContent>
		</Tooltip>
	);
}

export function DashboardSidebar({
	variant,
	onNavigate,
	collapsible = false
}: {
	variant: WorkspaceVariant;
	onNavigate?: () => void;
	/**
	 * Only the persistent desktop aside can collapse. The mobile sheet renders
	 * this same component at full width, where a tooltip repeating a label the
	 * user can already read is noise — so tooltips are opt-in, like the
	 * `rail-collapsed:` styles are scoped to `[data-dashboard-rail]`.
	 */
	collapsible?: boolean;
}) {
	const pathname = usePathname();
	const config = useWorkspaceConfig(variant);
	const { collapsed } = useSidebarCollapse();
	const showLabelTooltips = collapsible && collapsed;

	// Longest-prefix-wins: a nav item is active only if it is the most specific
	// href matching the current path. This stops the workspace root (e.g. "/auditor")
	// from staying highlighted on every sub-page like "/auditor/places".
	const activeHref = [...config.navigation, ...config.secondaryNavigation]
		.map(item => item.href)
		.filter(href => pathname === href || pathname.startsWith(`${href}/`))
		.sort((left, right) => right.length - left.length)[0];
	const isActive = (href: string) => href === activeHref;

	return (
		<div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
			{/* Skip link. `fixed`, not `absolute`: the rail clips its overflow while
			    it animates, and a skip link that gets clipped is a skip link that
			    does not exist. */}
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-sm focus:bg-background focus:px-3 focus:py-1.5 focus:text-sm focus:font-medium focus:text-foreground focus:ring-2 focus:ring-ring">
				Skip to main content
			</a>

			{/* Brand header — the wordmark becomes the mark, and the workspace
			    blurb is the first thing to go: it is orientation, not navigation. */}
			<div
				className={cn(
					"border-b border-sidebar-border px-6 py-6",
					// The header bar's 56px plus its own 1px rule: border-box means this
					// block has to absorb the rule for the two lines to land on the
					// same pixel once the labels are gone.
					"rail-collapsed:flex rail-collapsed:h-[calc(var(--spacing)*14+1px)] rail-collapsed:items-center",
					"rail-collapsed:justify-center rail-collapsed:px-3.5 rail-collapsed:py-0"
				)}>
				<BrandLogo
					variant="horizontalSubtitle"
					tone="dark"
					className="max-w-[220px] rail-collapsed:hidden"
					priority
				/>
				<BrandLogo variant="mark" tone="dark" className="mx-auto hidden size-9 rail-collapsed:block" priority />

				<div className="mt-5 space-y-1.5 rail-collapsed:hidden">
					<h2 className="text-base font-semibold tracking-tight">{config.title ?? "YEE Audit Tools"}</h2>
					<p className="text-sm leading-relaxed text-sidebar-foreground/60">{config.description}</p>
				</div>
			</div>

			{/* Primary navigation */}
			<div className="flex-1 overflow-y-auto px-4 py-5 rail-collapsed:px-3.5">
				<p className="px-3 text-xs font-medium text-sidebar-foreground/45 rail-collapsed:hidden">Workspace</p>
				<nav className="mt-2 space-y-1 rail-collapsed:mt-0" aria-label="Main navigation">
					{config.navigation.map(item => {
						const Icon = item.icon;
						const active = isActive(item.href);

						return (
							<RailTooltip key={item.href} label={item.label} enabled={showLabelTooltips}>
								<Link
									href={item.href}
									onClick={onNavigate}
									aria-current={active ? "page" : undefined}
									className={cn(
										NAV_ROW,
										active
											? cn("bg-sidebar-accent text-sidebar-accent-foreground", NAV_ACTIVE_MARKER)
											: "text-sidebar-foreground/75 hover:bg-white/6 hover:text-sidebar-foreground"
									)}>
									<Icon className={NAV_ICON} aria-hidden="true" />
									<span className={NAV_LABEL}>{item.label}</span>
								</Link>
							</RailTooltip>
						);
					})}
				</nav>

				{/* Sidebar CTA card. Collapsed it keeps only its action, as a rail
				    button — for auditors this is the only Start Audit entry point,
				    so it can shrink but it cannot be dropped. */}
				{config.sidebarCard ? (
					<div
						className={cn(
							"mt-8 rounded-md border border-sidebar-border bg-sidebar-accent p-4",
							"rail-collapsed:mt-4 rail-collapsed:border-0 rail-collapsed:bg-transparent rail-collapsed:p-0"
						)}>
						<div className="rail-collapsed:hidden">
							<p className="text-xs font-medium text-sidebar-foreground/55">
								{config.sidebarCard.eyebrow}
							</p>
							<h3 className="mt-2 text-sm font-semibold text-sidebar-foreground">
								{config.sidebarCard.title}
							</h3>
							<p className="mt-1.5 text-xs leading-relaxed text-sidebar-foreground/65">
								{config.sidebarCard.description}
							</p>
						</div>

						<RailTooltip label={config.sidebarCard.actionLabel} enabled={showLabelTooltips}>
							<Button
								asChild
								size="sm"
								className={cn(
									"mt-4 w-full bg-background text-foreground hover:bg-accent",
									"rail-collapsed:mt-0 rail-collapsed:size-11 rail-collapsed:p-0"
								)}>
								<Link href={config.sidebarCard.actionHref} onClick={onNavigate}>
									<config.sidebarCard.actionIcon
										className="size-3.5 rail-collapsed:size-5"
										aria-hidden="true"
									/>
									<span className={NAV_LABEL}>{config.sidebarCard.actionLabel}</span>
								</Link>
							</Button>
						</RailTooltip>
					</div>
				) : null}
			</div>

			{/* Secondary navigation + logout */}
			<div className="border-t border-sidebar-border px-4 py-4 rail-collapsed:px-3.5">
				{config.secondaryNavigation.length > 0 ? (
					<nav className="mb-3 space-y-1" aria-label="Secondary navigation">
						{config.secondaryNavigation.map(item => {
							const Icon = item.icon;
							const active = isActive(item.href);

							return (
								<RailTooltip key={item.href} label={item.label} enabled={showLabelTooltips}>
									<Link
										href={item.href}
										onClick={onNavigate}
										aria-current={active ? "page" : undefined}
										className={cn(
											NAV_ROW,
											active
												? cn("bg-white/10 text-sidebar-foreground", NAV_ACTIVE_MARKER)
												: "text-sidebar-foreground/65 hover:bg-white/6 hover:text-sidebar-foreground"
										)}>
										<Icon className={NAV_ICON} aria-hidden="true" />
										<span className={NAV_LABEL}>{item.label}</span>
									</Link>
								</RailTooltip>
							);
						})}
					</nav>
				) : null}

				<RailTooltip label="Logout" enabled={showLabelTooltips}>
					<LogoutButton />
				</RailTooltip>
			</div>
		</div>
	);
}
