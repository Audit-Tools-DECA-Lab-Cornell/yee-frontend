import * as React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ArrowUp, ArrowDown, Minus, HelpCircle, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type StatCardTone = "default" | "sky" | "amber" | "emerald" | "violet";

/**
 * Tone → a single brand-harmonized accent color (a short "tick" beside the
 * label + optional icon chip). No more pastel background floods: every card is
 * a clean white surface, differentiated by a restrained accent from the shared
 * data-viz palette so the grid reads as one coordinated family.
 */
const toneAccent: Record<StatCardTone, { tick: string; chip: string }> = {
	default: { tick: "bg-primary", chip: "bg-accent text-primary" },
	emerald: { tick: "bg-score-high", chip: "bg-score-high-bg text-score-high" },
	sky: { tick: "bg-chart-2", chip: "bg-domain-activity-light text-domain-activity-strong" },
	amber: { tick: "bg-score-mid", chip: "bg-score-mid-bg text-score-mid" },
	violet: { tick: "bg-chart-4", chip: "bg-domain-use-light text-domain-use-strong" }
};

type StatCardTrend = {
	/** e.g. "+12%", "3 new". Rendered with tabular numerals. */
	value: string;
	direction: "up" | "down" | "neutral";
};

type StatCardProps = {
	label: string;
	value: React.ReactNode;
	description?: React.ReactNode;
	/** Plain-language definition surfaced via a "?" tooltip next to the label. */
	hint?: React.ReactNode;
	/** Makes the whole card a navigation link. */
	href?: string;
	/** Renders a CTA button (the "actionable" variant). */
	action?: { label: string; href: string };
	/** Optional trailing header slot, e.g. a Badge. */
	badge?: React.ReactNode;
	/** Optional icon rendered as a brand-tinted chip in the top-right. */
	icon?: LucideIcon;
	/** Optional trend/delta indicator shown under the value. */
	trend?: StatCardTrend;
	tone?: StatCardTone;
	size?: "md" | "lg";
	className?: string;
};

const trendConfig = {
	up: { Icon: ArrowUp, className: "text-score-high" },
	down: { Icon: ArrowDown, className: "text-score-low" },
	neutral: { Icon: Minus, className: "text-muted-foreground" }
} as const;

/**
 * One metric/stat card for the whole app — a single component driven by props
 * that replaces the divergent KPI/metric/action-card treatments. Editorial
 * numerals, an uppercase micro-label, and a restrained brand accent.
 */
function StatCard({
	label,
	value,
	description,
	hint,
	href,
	action,
	badge,
	icon: Icon,
	trend,
	tone = "default",
	size = "lg",
	className
}: StatCardProps) {
	const accent = toneAccent[tone];
	const trendMeta = trend ? trendConfig[trend.direction] : null;

	const card = (
		<Card
			className={cn(
				"h-full gap-0 bg-card transition-colors",
				href && "hover:border-primary/40 hover:bg-accent/30",
				className
			)}>
			<CardHeader className="flex flex-col gap-2 pb-3">
				<div className="flex items-start justify-between gap-3">
					<CardDescription className="flex items-center gap-2">
						<span className={cn("h-3.5 w-1 rounded-full", accent.tick)} aria-hidden />
						<span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
							{label}
						</span>
						{hint ? (
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										className="inline-flex text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:text-foreground"
										aria-label={`What does “${label}” mean?`}>
										<HelpCircle className="size-3.5" />
									</button>
								</TooltipTrigger>
								<TooltipContent>{hint}</TooltipContent>
							</Tooltip>
						) : null}
					</CardDescription>
					{Icon ? (
						<span className={cn("inline-flex size-8 items-center justify-center rounded-md", accent.chip)}>
							<Icon className="size-4" aria-hidden />
						</span>
					) : badge ? (
						<div className="shrink-0">{badge}</div>
					) : null}
				</div>

				<CardTitle
					className={cn(
						"font-semibold tabular-nums tracking-tight text-foreground",
						size === "lg" ? "text-3xl" : "text-2xl"
					)}>
					{value}
				</CardTitle>

				{trend && trendMeta ? (
					<div className={cn("flex items-center gap-1 text-xs font-medium", trendMeta.className)}>
						<trendMeta.Icon className="size-3.5" aria-hidden />
						<span className="tabular-nums">{trend.value}</span>
					</div>
				) : null}
			</CardHeader>

			{description || action || href ? (
				<CardContent className="mt-auto flex flex-col gap-4 pt-2 text-sm leading-6 text-muted-foreground">
					{description ? <div>{description}</div> : null}
					{action ? (
						<Button asChild className="w-full">
							<Link href={action.href}>
								{action.label}
								<ArrowRight className="size-4" />
							</Link>
						</Button>
					) : null}
					{href && !action ? (
						<span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
							Open <ArrowUpRight className="size-3.5" />
						</span>
					) : null}
				</CardContent>
			) : null}
		</Card>
	);

	if (href) {
		return (
			<Link href={href} className="block h-full rounded-md focus-visible:outline-none">
				{card}
			</Link>
		);
	}
	return card;
}

export { StatCard };
export type { StatCardProps, StatCardTone, StatCardTrend };
