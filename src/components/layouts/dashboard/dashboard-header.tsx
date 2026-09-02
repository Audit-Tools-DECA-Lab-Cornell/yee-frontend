"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeftRight, Bell, LogOut, Menu, Search } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { useAuth } from "@/features/auth/components/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DashboardSidebar } from "@/components/layouts/dashboard/dashboard-sidebar";
import { useWorkspaceConfig } from "@/components/layouts/dashboard/site-copy-provider";
import { getUserDisplayName, getUserInitials, getUserRoleLabel } from "@/features/auth/user-display";
import type { WorkspaceVariant } from "@/components/layouts/dashboard/workspace-config";

/**
 * Degradation ladder, first to drop -> last. Add a control by placing it on this
 * list, not by picking a breakpoint that happens to look right.
 *
 *   page description (< xl) -> page title (< lg) -> role switch button, which
 *   becomes an account-menu item (< lg) -> search and notifications, both still
 *   placeholders (< md) -> primary action label, icon and label kept for screen
 *   readers (< sm) -> account name and role, still in the menu (< lg).
 *
 * Never dropped at any width: the navigation menu, the primary action, and the
 * account menu — which is why the role switch moved into it.
 */

/**
 * Every control in the bar is at least 40px on touch and the bar itself is a
 * fixed 56px, so nothing in the row can drag the shared centre axis around.
 */
const TOUCH_CONTROL = "size-10 lg:size-8";

export function DashboardHeader({ variant }: { variant: WorkspaceVariant }) {
	const pathname = usePathname();
	const config = useWorkspaceConfig(variant);
	const { session, logout } = useAuth();
	const router = useRouter();

	const showPrimaryAction = variant !== "auditor";

	const content =
		Object.entries(config.pageCopy)
			.sort((a, b) => b[0].length - a[0].length)
			.find(([key]) => pathname === key || pathname.startsWith(`${key}/`))?.[1] ??
		Object.values(config.pageCopy)[0];

	const userDisplayName = session?.user ? getUserDisplayName(session.user) : null;
	const userInitials = session?.user ? getUserInitials(session.user) : "...";
	const userRoleLabel = session?.user ? getUserRoleLabel(session.user.account_type) : "";

	// The one control that used to vanish between 768px and 1024px with no other
	// route to it. It is a button at desktop and a menu item below that, so the
	// role switch exists at every width.
	const roleSwitch =
		variant === "manager" && session?.user.has_auditor_profile && session.user.auditor_dashboard_path
			? { href: session.user.auditor_dashboard_path, label: "Auditor view" }
			: variant === "auditor" && session?.user.account_type === "MANAGER"
				? { href: session.user.dashboard_path, label: "Manager view" }
				: null;

	return (
		<header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
			<div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
				{/* Nav control first, brand second — the near-universal order, and it
				    puts the more consequential control first in the tab order too. */}
				<Sheet>
					<SheetTrigger asChild>
						<Button
							variant="outline"
							size="icon"
							className={`${TOUCH_CONTROL} shrink-0 lg:hidden`}
							aria-label="Open dashboard menu">
							<Menu className="size-4" aria-hidden="true" />
						</Button>
					</SheetTrigger>
					<SheetContent
						side="left"
						showCloseButton={false}
						className="w-[310px] max-w-[310px] overflow-hidden border-r-0 p-0">
						<SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
						<SheetDescription className="sr-only">
							Navigate between overview, projects, places, audits, and settings.
						</SheetDescription>
						<DashboardSidebar variant={variant} />
					</SheetContent>
				</Sheet>

				{/* Bare mark, no chrome: it must not read as a second button sitting
				    next to the menu one. */}
				<Link
					href={config.navigation[0]?.href ?? "/"}
					aria-label="Dashboard home"
					className="shrink-0 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:hidden">
					<BrandLogo variant="mark" tone="light" className="h-8 w-8" />
				</Link>

				{/* Chrome, not content: the page's own <h1> lives in the hero below,
				    so this is a <p> and the page is announced exactly once. */}
				<div className="hidden min-w-0 lg:block">
					<p className="truncate text-lg font-semibold tracking-tight text-foreground">{content.title}</p>
					{/* Only where there is genuinely room for the whole sentence. A
					    description cut off mid-word is worse than no description. */}
					{content.description ? (
						<p className="hidden truncate text-xs text-muted-foreground xl:block">{content.description}</p>
					) : null}
				</div>

				<div className="ml-auto flex shrink-0 items-center gap-2">
					{/* Command palette placeholder - visible intent for future search.
					    Search and the bell are both not wired up yet, so they share one
					    breakpoint and neither takes width from a control that works. */}
					<Button
						variant="outline"
						size="default"
						className="hidden h-10 items-center gap-2 text-muted-foreground md:inline-flex lg:h-8"
						aria-label="Open command palette (keyboard shortcut: Command K)"
						onClick={() => {
							/* Command palette will be wired here in a future pass */
						}}>
						<Search className="size-4.5" aria-hidden="true" />
						<span className="text-xs">Search</span>
						{/* Gap, not a fixed one: dropping the hint on touch must reflow
						    the button rather than leave a hole where it used to sit. */}
						<kbd
							className="ml-4 hidden rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px] leading-none text-muted-foreground lg:inline"
							aria-hidden="true">
							⌘K
						</kbd>
					</Button>

					{roleSwitch ? (
						<Button asChild variant="outline" size="sm" className="hidden lg:inline-flex">
							<Link href={roleSwitch.href}>{roleSwitch.label}</Link>
						</Button>
					) : null}

					{/* Notification bell - placeholder for future notification system */}
					<Button
						variant="outline"
						size="icon"
						className={`${TOUCH_CONTROL} hidden md:inline-flex`}
						aria-label="Notifications (coming soon)">
						<Bell className="size-4" aria-hidden="true" />
					</Button>

					{showPrimaryAction ? (
						<Button asChild size="default" className="h-10 lg:h-8">
							<Link href={config.primaryAction.href}>
								<config.primaryAction.icon className="size-4" aria-hidden="true" />
								{/* Label is the first thing to go: the icon plus the
								    aria-label still names the action at the narrowest width. */}
								<span className="hidden sm:inline">{config.primaryAction.label}</span>
								<span className="sr-only sm:hidden">{config.primaryAction.label}</span>
							</Link>
						</Button>
					) : null}

					{/* Identity is the lowest-priority thing in the bar, so it is an
					    avatar until there is width to spare — and it is now a real menu,
					    which is where the role switch and logout belong. */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								aria-label={userDisplayName ? `Account menu for ${userDisplayName}` : "Account menu"}
								className="flex h-10 shrink-0 items-center gap-2.5 rounded-md border border-border bg-card px-1.5 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:h-8 lg:px-2">
								<Avatar size="default" className="size-7 lg:size-6">
									<AvatarFallback className="bg-(--yee-green-100) text-[11px] leading-none font-semibold text-(--yee-green-900)">
										{userInitials}
									</AvatarFallback>
								</Avatar>
								<div className="hidden min-w-0 flex-col items-start lg:flex">
									<p className="truncate text-xs font-medium text-foreground">
										{userDisplayName ?? " "}
									</p>
									<p className="text-[10px] text-muted-foreground">{userRoleLabel}</p>
								</div>
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<div className="px-2 py-1.5">
								<p className="truncate text-sm font-medium text-foreground">
									{userDisplayName ?? "Account"}
								</p>
								<p className="text-xs text-muted-foreground">{userRoleLabel}</p>
							</div>
							<DropdownMenuSeparator />
							{roleSwitch ? (
								<DropdownMenuItem asChild className="lg:hidden">
									<Link href={roleSwitch.href}>
										<ArrowLeftRight className="size-4" aria-hidden="true" />
										{roleSwitch.label}
									</Link>
								</DropdownMenuItem>
							) : null}
							<DropdownMenuItem
								onSelect={() => {
									logout();
									router.push("/login");
								}}>
								<LogOut className="size-4" aria-hidden="true" />
								Logout
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
}
