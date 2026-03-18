"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	ClipboardList,
	FilePlus2,
	FolderKanban,
	LayoutDashboard,
	LogOut,
	MapPinned,
	Settings2
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
	{ label: "Overview", href: "/dashboard", icon: LayoutDashboard },
	{ label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
	{ label: "Places", href: "/dashboard/places", icon: MapPinned },
	{ label: "Audits", href: "/dashboard/audits", icon: ClipboardList }
];

const secondaryNavigation = [{ label: "Settings", href: "/dashboard/settings", icon: Settings2 }];

export function DashboardSidebar({ onNavigate }: { onNavigate?: () => void }) {
	const pathname = usePathname();

	return (
		<div className="flex h-full flex-col bg-[#10231f] text-white">
			<div className="border-b border-white/10 px-6 py-6">
				<Badge className="border-emerald-300/30 bg-emerald-300/12 text-[11px] tracking-[0.2em] text-emerald-100 uppercase">
					DECA Lab
				</Badge>
				<div className="mt-4 space-y-2">
					<h1 className="text-xl font-semibold tracking-tight">YEE Dashboard</h1>
					<p className="text-sm leading-6 text-emerald-50/70">
						A calm workspace for managing projects, places, audits, and fieldwork.
					</p>
				</div>
			</div>

			<div className="flex-1 px-4 py-5">
				<p className="px-3 text-xs font-medium uppercase tracking-[0.24em] text-emerald-50/45">Workspace</p>
				<nav className="mt-3 space-y-1.5">
					{navigation.map(item => {
						const Icon = item.icon;
						const active = pathname === item.href;

						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={onNavigate}
								className={cn(
									"flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors",
									active
										? "bg-linear-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-lg shadow-emerald-950/20"
										: "text-emerald-50/80 hover:bg-white/6 hover:text-white"
								)}>
								<Icon className="size-4.5" />
								<span>{item.label}</span>
							</Link>
						);
					})}
				</nav>

				<div className="mt-8 rounded-3xl border border-white/10 bg-white/6 p-4">
					<p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-50/45">Quick start</p>
					<h2 className="mt-3 text-base font-semibold">Launch a new YEE audit</h2>
					<p className="mt-2 text-sm leading-6 text-emerald-50/70">
						Use the current frontend form while backend APIs are being finalized.
					</p>
					<Button
						asChild
						className="mt-4 w-full rounded-2xl bg-white text-slate-950 hover:bg-emerald-50"
						size="lg">
						<Link href="/yee/audit/place-central-park" onClick={onNavigate}>
							<FilePlus2 className="size-4" />
							Start Audit
						</Link>
					</Button>
				</div>
			</div>

			<div className="border-t border-white/10 px-4 py-4">
				<nav className="space-y-1.5">
					{secondaryNavigation.map(item => {
						const Icon = item.icon;
						const active = pathname === item.href;

						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={onNavigate}
								className={cn(
									"flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors",
									active ? "bg-white/10 text-white" : "text-emerald-50/70 hover:bg-white/6 hover:text-white"
								)}>
								<Icon className="size-4.5" />
								<span>{item.label}</span>
							</Link>
						);
					})}
				</nav>

				<button
					type="button"
					className="mt-3 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-emerald-50/70 transition-colors hover:bg-white/6 hover:text-white">
					<LogOut className="size-4.5" />
					<span>Logout</span>
				</button>
			</div>
		</div>
	);
}
