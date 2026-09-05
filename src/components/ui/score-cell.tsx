import { ScoreStack } from "@/components/ui/score-stack";
import { cn } from "@/lib/utils";

type ScoreCellProps = {
	raw?: number | null;
	rawMax?: number | null;
	weighted?: number | null;
	weightedMax?: number | null;
	/** Hide the raw score line. */
	showRaw?: boolean;
	/** Hide the youth-weighted line. */
	showWeighted?: boolean;
	align?: "start" | "end";
	/** `inverse` inherits the current text color for dark surfaces. */
	tone?: "default" | "inverse";
	className?: string;
};

/**
 * The single, null-safe score renderer used everywhere a score appears
 * (tables, cards, detail pages, reports). Each score is a `ScoreStack`: the
 * percentage leads and the labelled fraction sits beneath it, muted. Missing
 * values render as an em dash instead of throwing - weighted fields are absent
 * during the backend scoring rollout, which previously crashed the auditor
 * dashboard.
 */
function ScoreCell({
	raw,
	rawMax,
	weighted,
	weightedMax,
	showRaw = true,
	showWeighted = true,
	align = "start",
	tone = "default",
	className
}: ScoreCellProps) {
	return (
		<div className={cn("flex flex-col gap-2 text-sm", align === "end" && "items-end text-right", className)}>
			{showRaw ? <ScoreStack label="Raw" value={raw} max={rawMax} size="sm" align={align} tone={tone} /> : null}
			{showWeighted ? (
				<ScoreStack
					label="Youth Weighted"
					value={weighted}
					max={weightedMax}
					fractionDigits={2}
					size="sm"
					align={align}
					tone={tone}
				/>
			) : null}
		</div>
	);
}

export { ScoreCell };
export type { ScoreCellProps };
