"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Bell, Menu, Search } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/auth/logout-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { useWorkspaceConfig } from "@/components/dashboard/site-copy-provider";
import { getUserDisplayName, getUserInitials, getUserRoleLabel } from "@/lib/auth/user-display";
import { fetchDashboardOverview, fetchUsers } from "@/lib/dashboard/live-api";
import type { WorkspaceVariant } from "@/lib/dashboard/workspace-config";

export function DashboardHeader({ variant }: { variant: WorkspaceVariant }) {
	const pathname = usePathname();
	const config = useWorkspaceConfig(variant);
	const { session } = useAuth();

	const showPrimaryAction = variant !== "auditor";
	const hideSearch =
		(variant === "admin" &&
			(pathname === "/admin/users" ||
				pathname === "/admin/projects" ||
				pathname === "/admin/places")) ||
		(variant === "manager" &&
			(pathname === "/dashboard/places" ||
				pathname === "/dashboard/auditors" ||
				pathname === "/dashboard/audits"));

	const content =
		Object.entries(config.pageCopy)
			.sort((a, b) => b[0].length - a[0].length)
			.find(([key]) => pathname === key || pathname.startsWith(`${key}/`))?.[1] ??
		Object.values(config.pageCopy)[0];

	// Live header badges — only fetched for the admin variant.
	const [liveHeaderBadges, setLiveHeaderBadges] = React.useState<string[]>([]);

	React.useEffect(() => {
		if (variant !== "admin" || !session) return;
		let cancelled = false;

		const run = async () => {
			try {
				const [overview, users] = await Promise.all([
					fetchDashboardOverview(session),
					fetchUsers(session),
				]);
				if (cancelled) return;
				const completedAuditsMetric = overview.metrics.find((metric) =>
					metric.title.toLowerCase().includes("audit")
				);
				const completedAudits = completedAuditsMetric?.value
					? Number.parseInt(completedAuditsMetric.value, 10)
					: 0;
				setLiveHeaderBadges([
					`${users.length} users total`,
					`${Number.isNaN(completedAudits) ? 0 : completedAudits} completed audits`,
				]);
			} catch {
				// Leave badges empty if the fetch fails; non-critical UI.
			}
		};

		void run();
		return () => {
			cancelled = true;
		};
	}, [session, variant]);

	// Derive display name and initials from the live session user.
	const userDisplayName = session?.user ? getUserDisplayName(session.user) : null;
	const userInitials = session?.user ? getUserInitials(session.user) : "…";
	const userRoleLabel = session?.user ? getUserRoleLabel(session.user.account_type) : "";

	return (
		<header className="sticky top-0 z-20 border-b border-slate-200/80 bg-[#f6f3ea]/90 backdrop-blur">
			<div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-start gap-3">
						<Sheet>
							<SheetTrigger asChild>
								<Button variant="outline" size="icon" className="mt-0.5 rounded-2xl lg:hidden">
									<Menu className="size-4" />
									<span className="sr-only">Open dashboard menu</span>
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

						<div>
							<div className="flex items-center gap-2">
								<Badge
									variant="secondary"
									className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
									{config.badge}
								</Badge>
							</div>
							<h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
								{content.title}
							</h2>
							<p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
								{content.description}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2 sm:gap-3">
						{variant === "manager" &&
						session?.user.has_auditor_profile &&
						session.user.auditor_dashboard_path ? (
							<Button
								asChild
								variant="outline"
								className="hidden rounded-2xl border-slate-200 bg-white lg:inline-flex">
								<Link href={session.user.auditor_dashboard_path}>Auditor View</Link>
							</Button>
						) : null}
						{variant === "auditor" && session?.user.account_type === "MANAGER" ? (
							<Button
								asChild
								variant="outline"
								className="hidden rounded-2xl border-slate-200 bg-white lg:inline-flex">
								<Link href={session.user.dashboard_path}>Manager View</Link>
							</Button>
						) : null}
						<LogoutButton className="mt-0 hidden w-auto border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-950 lg:flex" />
						<Button
							variant="outline"
							size="icon"
							className="hidden rounded-2xl border-slate-200 bg-white sm:inline-flex">
							<Bell className="size-4" />
							<span className="sr-only">Notifications</span>
						</Button>
						{showPrimaryAction ? (
							<Button asChild className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
								<Link href={config.primaryAction.href}>
									<config.primaryAction.icon className="size-4" />
									{config.primaryAction.label}
								</Link>
							</Button>
						) : null}
						<div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 sm:flex">
							<Avatar size="lg">
								<AvatarFallback className="bg-emerald-100 font-semibold text-emerald-700">
									{userInitials}
								</AvatarFallback>
							</Avatar>
							<div className="min-w-0">
								<p className="truncate text-sm font-medium text-slate-900">
									{userDisplayName ?? "\u00A0"}
								</p>
								<p className="text-xs text-slate-500">{userRoleLabel}</p>
							</div>
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					{hideSearch ? (
						<div className="flex w-full max-w-xl items-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
							These data pages use structured filters below instead of a generic search bar.
						</div>
					) : (
						<label className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
							<Search className="size-4 text-slate-400" />
							<input
								type="search"
								placeholder={config.searchPlaceholder}
								className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
							/>
						</label>
					)}

					{liveHeaderBadges.length > 0 ? (
						<div className="flex flex-wrap items-center gap-2">
							{liveHeaderBadges.map((item) => (
								<Badge
									key={item}
									className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 hover:bg-emerald-100">
									{item}
								</Badge>
							))}
						</div>
					) : null}
				</div>
			</div>
		</header>
	);
}
