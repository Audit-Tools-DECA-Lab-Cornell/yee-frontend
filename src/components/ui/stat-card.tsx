import * as React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type StatCardTone = "default" | "sky" | "amber" | "emerald" | "violet";

const toneStyles: Record<StatCardTone, string> = {
	default: "",
	sky: "border-sky-200/70 bg-sky-50/40",
	amber: "border-amber-200/70 bg-amber-50/40",
	emerald: "border-emerald-200/70 bg-emerald-50/40",
	violet: "border-violet-200/70 bg-violet-50/40"
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
	tone?: StatCardTone;
	size?: "md" | "lg";
	className?: string;
};

/**
 * One metric/stat card for the whole app — replaces the ~5 divergent
 * treatments (dashboard KPIs, reports KPIs, detail-page metrics, action
 * cards) with a single component driven by props.
 */
function StatCard({
	label,
	value,
	description,
	hint,
	href,
	action,
	badge,
	tone = "default",
	size = "lg",
	className
}: StatCardProps) {
	const card = (
		<Card
			className={cn(
				"h-full rounded-md bg-white transition-colors",
				toneStyles[tone],
				href && "hover:border-primary/40 hover:bg-accent/40",
				className
			)}>
			<CardHeader className="pb-3">
				<CardDescription className="flex items-center gap-1.5">
					{label}
					{hint ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									className="inline-flex text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:text-foreground"
									aria-label={`What does “${label}” mean?`}>
									<HelpCircle className="size-3.5" />
								</button>
							</TooltipTrigger>
							<TooltipContent>{hint}</TooltipContent>
						</Tooltip>
					) : null}
				</CardDescription>
				<CardTitle
					className={cn(
						"font-semibold tracking-tight text-foreground",
						size === "lg" ? "text-3xl" : "text-2xl"
					)}>
					{value}
				</CardTitle>
				{badge ? <CardAction>{badge}</CardAction> : null}
			</CardHeader>
			{description || action || href ? (
				<CardContent className="flex flex-col gap-4 text-sm leading-6 text-muted-foreground">
					{description ? <div>{description}</div> : null}
					{action ? (
						<Button asChild className="w-full rounded-md">
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
export type { StatCardProps };
