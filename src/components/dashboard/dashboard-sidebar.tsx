"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { useWorkspaceConfig } from "@/components/dashboard/site-copy-provider";
import { Button } from "@/components/ui/button";
import type { WorkspaceVariant } from "@/lib/dashboard/workspace-config";
import { cn } from "@/lib/utils";

export function DashboardSidebar({ variant, onNavigate }: { variant: WorkspaceVariant; onNavigate?: () => void }) {
	const pathname = usePathname();
	const config = useWorkspaceConfig(variant);

	const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

	return (
		<div
			className="flex h-full flex-col"
			style={{ background: "var(--sidebar)", color: "var(--sidebar-foreground)" }}>
			{/* Skip navigation target helper — the real skip link is in DashboardShell */}
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-1.5 focus:text-sm focus:font-medium focus:text-foreground focus:ring-2 focus:ring-ring">
				Skip to main content
			</a>

			{/* Brand header */}
			<div className="border-b px-6 py-6" style={{ borderColor: "var(--sidebar-border)" }}>
				<div className="flex items-center gap-2.5">
					<span
						className="flex size-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
						style={{
							background: "var(--sidebar-primary)",
							color: "var(--sidebar-primary-foreground)"
						}}
						aria-hidden="true">
						YEE
					</span>
					<span className="text-sm font-semibold tracking-tight">Audit Tools</span>
				</div>

				<div className="mt-5 space-y-1.5">
					<h2 className="text-base font-semibold tracking-tight">{config.title ?? "YEE Audit Tools"}</h2>
					<p className="text-sm leading-relaxed" style={{ color: "oklch(0.95 0.006 158 / 0.60)" }}>
						{config.description}
					</p>
				</div>
			</div>

			{/* Primary navigation */}
			<div className="flex-1 overflow-y-auto px-4 py-5">
				<p className="px-3 text-xs font-medium" style={{ color: "var(--sidebar-foreground)", opacity: 0.45 }}>
					Workspace
				</p>
				<nav className="mt-2 space-y-1" aria-label="Main navigation">
					{config.navigation.map(item => {
						const Icon = item.icon;
						const active = isActive(item.href);

						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={onNavigate}
								aria-current={active ? "page" : undefined}
								className={cn(
									"flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
									active
										? "text-[var(--sidebar-accent-foreground)]"
										: "hover:text-[var(--sidebar-foreground)]"
								)}
								style={
									active
										? {
												background: "var(--sidebar-accent)",
												color: "var(--sidebar-accent-foreground)"
											}
										: { color: "oklch(0.95 0.006 158 / 0.75)" }
								}
								onMouseEnter={event => {
									if (!active) {
										(event.currentTarget as HTMLAnchorElement).style.background =
											"oklch(1 0 0 / 0.06)";
									}
								}}
								onMouseLeave={event => {
									if (!active) {
										(event.currentTarget as HTMLAnchorElement).style.background = "";
									}
								}}>
								<Icon className="size-4 shrink-0" aria-hidden="true" />
								<span>{item.label}</span>
							</Link>
						);
					})}
				</nav>

				{/* Sidebar CTA card — only if meaningful for this workspace */}
				{config.sidebarCard ? (
					<div
						className="mt-8 rounded-lg border p-4"
						style={{
							borderColor: "var(--sidebar-border)",
							background: "var(--sidebar-accent)"
						}}>
						<p className="text-xs font-medium" style={{ color: "oklch(0.95 0.006 158 / 0.55)" }}>
							{config.sidebarCard.eyebrow}
						</p>
						<h3 className="mt-2 text-sm font-semibold" style={{ color: "var(--sidebar-foreground)" }}>
							{config.sidebarCard.title}
						</h3>
						<p className="mt-1.5 text-xs leading-relaxed" style={{ color: "oklch(0.95 0.006 158 / 0.65)" }}>
							{config.sidebarCard.description}
						</p>
						<Button asChild size="sm" className="mt-4 w-full bg-background text-foreground hover:bg-accent">
							<Link href={config.sidebarCard.actionHref} onClick={onNavigate}>
								<config.sidebarCard.actionIcon className="size-3.5" aria-hidden="true" />
								{config.sidebarCard.actionLabel}
							</Link>
						</Button>
					</div>
				) : null}
			</div>

			{/* Secondary navigation + logout */}
			<div className="border-t px-4 py-4" style={{ borderColor: "var(--sidebar-border)" }}>
				{config.secondaryNavigation.length > 0 ? (
					<nav className="mb-3 space-y-1" aria-label="Secondary navigation">
						{config.secondaryNavigation.map(item => {
							const Icon = item.icon;
							const active = isActive(item.href);

							return (
								<Link
									key={item.href}
									href={item.href}
									onClick={onNavigate}
									aria-current={active ? "page" : undefined}
									className={cn(
										"flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
										active ? "" : ""
									)}
									style={
										active
											? {
													background: "oklch(1 0 0 / 0.10)",
													color: "var(--sidebar-foreground)"
												}
											: { color: "oklch(0.95 0.006 158 / 0.65)" }
									}
									onMouseEnter={event => {
										if (!active) {
											(event.currentTarget as HTMLAnchorElement).style.background =
												"oklch(1 0 0 / 0.06)";
											(event.currentTarget as HTMLAnchorElement).style.color =
												"var(--sidebar-foreground)";
										}
									}}
									onMouseLeave={event => {
										if (!active) {
											(event.currentTarget as HTMLAnchorElement).style.background = "";
											(event.currentTarget as HTMLAnchorElement).style.color =
												"oklch(0.95 0.006 158 / 0.65)";
										}
									}}>
									<Icon className="size-4 shrink-0" aria-hidden="true" />
									<span>{item.label}</span>
								</Link>
							);
						})}
					</nav>
				) : null}

				<LogoutButton />
			</div>
		</div>
	);
}
