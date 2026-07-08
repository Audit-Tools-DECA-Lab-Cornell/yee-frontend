import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type HeroStat = {
	label: string;
	value: React.ReactNode;
	helper?: string;
	href?: string;
};

type DashboardHeroProps = {
	badge?: string;
	title: string;
	subtitle?: React.ReactNode;
	/** Small badges / metadata rendered under the subtitle (e.g. status pills). */
	meta?: React.ReactNode;
	/** Action buttons rendered under the subtitle. */
	actions?: React.ReactNode;
	/** Optional label above the stat grid, e.g. "My field snapshot". */
	statsLabel?: string | React.ReactNode;
	stats?: HeroStat[];
	/** Extra custom tiles appended to the stat grid (e.g. a score tile). */
	children?: React.ReactNode;
	/** `compact` is roughly half height — used at the top of list/detail pages. */
	size?: "default" | "compact";
	className?: string;
};

const tileClass =
	"min-w-0 rounded-md border border-white/15 bg-linear-to-br from-white/[0.18] to-white/[0.07] p-4 backdrop-blur-sm";

function HeroStatTile({ stat }: { stat: HeroStat }) {
	const body = (
		<>
			<p className="truncate text-xs font-medium tracking-wide text-emerald-50/70 uppercase">{stat.label}</p>
			<p className="mt-2 text-3xl font-semibold tabular-nums text-white">{stat.value}</p>
			{stat.helper ? <p className="mt-2 text-xs leading-5 text-emerald-50/65">{stat.helper}</p> : null}
			{stat.href ? (
				<p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-100">
					Open <ArrowUpRight className="size-3" />
				</p>
			) : null}
		</>
	);

	if (stat.href) {
		return (
			<Link
				href={stat.href}
				className={cn(tileClass, "block transition hover:border-white/30 hover:bg-white/16")}>
				{body}
			</Link>
		);
	}
	return <div className={tileClass}>{body}</div>;
}

/**
 * The brand hero used at the top of dashboards and list pages. A tokenized
 * deep-green gradient (mapped to the brand greens, not hardcoded hex) layered
 * with a faint dot-grid motif, a low-opacity YEE watermark, and a hairline top
 * highlight — distinct and premium while staying minimal. `size="compact"` is
 * roughly half height for secondary pages; glass stat tiles are optional.
 */
function DashboardHero({
	badge,
	title,
	subtitle,
	meta,
	actions,
	statsLabel,
	stats,
	children,
	size = "default",
	className
}: DashboardHeroProps) {
	const compact = size === "compact";
	const hasStats = (stats && stats.length > 0) || Boolean(children);

	return (
		<section
			className={cn(
				"relative overflow-hidden rounded-md border border-white/10 text-white shadow-panel",
				className
			)}
			style={{
				backgroundImage:
					"linear-gradient(to bottom right, var(--banner-from), var(--banner-via), var(--banner-to))"
			}}>
			{/* Faint dot-grid motif */}
			<div
				className="pointer-events-none absolute inset-0 opacity-[0.07]"
				style={{
					backgroundImage: "radial-gradient(circle, white 1px, transparent 1.5px)",
					backgroundSize: "18px 18px"
				}}
				aria-hidden
			/>
			{/* YEE watermark */}
			<div
				className={cn(
					"pointer-events-none absolute opacity-[0.06]",
					compact ? "-top-5 -right-4" : "-top-8 -right-6"
				)}
				aria-hidden>
				<BrandLogo variant="mark" tone="dark" className={compact ? "w-36" : "w-52"} />
			</div>
			{/* Hairline top highlight */}
			<div
				className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/25 to-transparent"
				aria-hidden
			/>

			<div
				className={cn(
					"relative",
					compact ? "px-6 py-5 sm:px-8 sm:py-6" : "px-6 py-8 sm:px-8 lg:px-10 lg:py-10"
				)}>
				<div className={cn(actions && "sm:flex sm:items-start sm:justify-between sm:gap-4")}>
					<div className="min-w-0">
						{badge ? (
							<Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
								{badge}
							</Badge>
						) : null}
						<h1
							className={cn(
								"max-w-2xl font-semibold tracking-tight text-white",
								badge && "mt-4",
								compact ? "text-xl sm:text-2xl" : "mt-4 text-3xl sm:text-4xl"
							)}>
							{title}
						</h1>
						{subtitle ? (
							<p
								className={cn(
									"max-w-2xl leading-7 text-emerald-50/80",
									compact ? "mt-2 text-sm" : "mt-4 text-sm sm:text-base"
								)}>
								{subtitle}
							</p>
						) : null}
						{meta ? <div className="mt-5 flex flex-wrap gap-2">{meta}</div> : null}
					</div>
					{actions ? (
						<div className={cn("flex flex-wrap gap-3", compact ? "mt-4 sm:mt-0 sm:shrink-0" : "mt-0")}>
							{actions}
						</div>
					) : null}
				</div>

				{hasStats ? (
					<div className={cn(compact ? "mt-4 space-y-2" : "mt-8 space-y-4")}>
						{statsLabel && typeof statsLabel === "string" ? (
							<p className={cn("text-sm font-medium text-emerald-50/80", compact ? "pb-2" : "")}>
								{statsLabel}
							</p>
						) : null}
						{statsLabel && typeof statsLabel !== "string" ? statsLabel : null}
						<div
							className={cn(
								"grid gap-3",
								compact ? "sm:grid-cols-3 xl:grid-cols-5" : "sm:grid-cols-2 xl:grid-cols-4"
							)}>
							{stats?.map(stat => (
								<HeroStatTile key={stat.label} stat={stat} />
							))}
							{children ? <div className="min-w-0">{children}</div> : null}
						</div>
					</div>
				) : null}
			</div>
		</section>
	);
}

export { DashboardHero };
export type { DashboardHeroProps, HeroStat };
