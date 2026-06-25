"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Bell, Menu, Search } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { useWorkspaceConfig } from "@/components/dashboard/site-copy-provider";
import { getUserDisplayName, getUserInitials, getUserRoleLabel } from "@/lib/auth/user-display";
import type { WorkspaceVariant } from "@/lib/dashboard/workspace-config";

export function DashboardHeader({ variant }: { variant: WorkspaceVariant }) {
	const pathname = usePathname();
	const config = useWorkspaceConfig(variant);
	const { session } = useAuth();

	const showPrimaryAction = variant !== "auditor";

	const content =
		Object.entries(config.pageCopy)
			.sort((a, b) => b[0].length - a[0].length)
			.find(([key]) => pathname === key || pathname.startsWith(`${key}/`))?.[1] ??
		Object.values(config.pageCopy)[0];

	const userDisplayName = session?.user ? getUserDisplayName(session.user) : null;
	const userInitials = session?.user ? getUserInitials(session.user) : "...";
	const userRoleLabel = session?.user ? getUserRoleLabel(session.user.account_type) : "";

	return (
		<header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
			<div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
				{/* Left: mobile menu + page heading */}
				<div className="flex min-w-0 items-center gap-3">
					<Sheet>
						<SheetTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								className="lg:hidden"
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

					<div className="min-w-0">
						<h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
							{content.title}
						</h1>
						{content.description ? (
							<p className="hidden text-xs text-muted-foreground sm:block">{content.description}</p>
						) : null}
					</div>
				</div>

				{/* Right: actions + user */}
				<div className="flex shrink-0 items-center gap-2">
					{/* Command palette placeholder — visible intent for future search */}
					<Button
						variant="outline"
						size="sm"
						className="hidden items-center gap-2 text-muted-foreground sm:inline-flex"
						aria-label="Open command palette (keyboard shortcut: Command K)"
						onClick={() => {
							/* Command palette will be wired here in a future pass */
						}}>
						<Search className="size-3.5" aria-hidden="true" />
						<span className="text-xs">Search</span>
						<kbd
							className="ml-1 hidden rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-mono leading-none text-muted-foreground lg:inline"
							aria-hidden="true">
							⌘K
						</kbd>
					</Button>

					{/* Role-switch links */}
					{variant === "manager" &&
						session?.user.has_auditor_profile &&
						session.user.auditor_dashboard_path ? (
						<Button asChild variant="outline" size="sm" className="hidden lg:inline-flex">
							<Link href={session.user.auditor_dashboard_path}>Auditor view</Link>
						</Button>
					) : null}
					{variant === "auditor" && session?.user.account_type === "MANAGER" ? (
						<Button asChild variant="outline" size="sm" className="hidden lg:inline-flex">
							<Link href={session.user.dashboard_path}>Manager view</Link>
						</Button>
					) : null}

					{/* Notification bell — placeholder for future notification system */}
					<Button
						variant="outline"
						size="icon"
						className="hidden sm:inline-flex"
						aria-label="Notifications (coming soon)">
						<Bell className="size-4" aria-hidden="true" />
					</Button>

					{/* Primary action CTA */}
					{showPrimaryAction ? (
						<Button asChild size="sm" className="hidden sm:inline-flex">
							<Link href={config.primaryAction.href}>
								<config.primaryAction.icon className="size-3.5" aria-hidden="true" />
								{config.primaryAction.label}
							</Link>
						</Button>
					) : null}

					{/* User identity chip */}
					<div className="hidden items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-1.5 sm:flex">
						<Avatar size="sm">
							<AvatarFallback className="bg-[var(--yee-green-100)] text-xs font-semibold text-[var(--yee-green-900)]">
								{userInitials}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0">
							<p className="truncate text-xs font-medium text-foreground">
								{userDisplayName ?? "\u00A0"}
							</p>
							<p className="text-[10px] text-muted-foreground">{userRoleLabel}</p>
						</div>
					</div>

					<LogoutButton className="hidden w-auto lg:flex" />
				</div>
			</div>
		</header>
	);
}
