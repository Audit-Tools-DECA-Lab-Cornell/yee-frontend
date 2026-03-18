"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { workspaceConfigs, type WorkspaceVariant } from "@/lib/dashboard/workspace-config";

export function DashboardHeader({ variant }: { variant: WorkspaceVariant }) {
	const pathname = usePathname();
	const config = workspaceConfigs[variant];
	const content =
		Object.entries(config.pageCopy)
			.sort((a, b) => b[0].length - a[0].length)
			.find(([key]) => pathname === key || pathname.startsWith(`${key}/`))?.[1] ?? Object.values(config.pageCopy)[0];

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
								<Badge variant="secondary" className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
									{config.badge}
								</Badge>
							</div>
							<h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
								{content.title}
							</h2>
							<p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{content.description}</p>
						</div>
					</div>

					<div className="flex items-center gap-2 sm:gap-3">
						<Button
							variant="outline"
							size="icon"
							className="hidden rounded-2xl border-slate-200 bg-white sm:inline-flex">
							<Bell className="size-4" />
							<span className="sr-only">Notifications</span>
						</Button>
						<Button asChild className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
							<Link href={config.primaryAction.href}>
								<config.primaryAction.icon className="size-4" />
								{config.primaryAction.label}
							</Link>
						</Button>
						<div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 sm:flex">
							<Avatar size="lg">
								<AvatarFallback className="bg-emerald-100 font-semibold text-emerald-700">
									{config.user.initials}
								</AvatarFallback>
							</Avatar>
							<div className="min-w-0">
								<p className="truncate text-sm font-medium text-slate-900">{config.user.name}</p>
								<p className="text-xs text-slate-500">{config.user.roleLabel}</p>
							</div>
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<label className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
						<Search className="size-4 text-slate-400" />
						<input
							type="search"
							placeholder={config.searchPlaceholder}
							className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
						/>
					</label>

					<div className="flex flex-wrap items-center gap-2">
						{config.headerBadges.map(item => (
							<Badge
								key={item}
								className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 hover:bg-emerald-100">
								{item}
							</Badge>
						))}
					</div>
				</div>
			</div>
		</header>
	);
}
