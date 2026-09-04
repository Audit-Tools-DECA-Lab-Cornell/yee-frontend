import { scoreBand } from "@/lib/score-band";
import { SCORE_UNAVAILABLE, formatScoreFraction, formatScoreSummary, scorePercent } from "@/lib/score-format";
import { cn } from "@/lib/utils";

type ScoreStackSize = "sm" | "md" | "lg" | "xl";

const PERCENT_CLASSES: Record<ScoreStackSize, string> = {
	sm: "text-sm",
	md: "text-base",
	lg: "text-lg",
	xl: "text-3xl tracking-tight"
};

const DETAIL_CLASSES: Record<ScoreStackSize, string> = {
	sm: "text-xs",
	md: "text-xs",
	lg: "text-xs",
	xl: "text-sm"
};

type ScoreStackProps = {
	value?: number | null;
	max?: number | null;
	/** Decimals for the fraction — 2 for youth-weighted scores. */
	fractionDigits?: number;
	/** Prefix for the secondary line: `Raw` renders `Raw 18 / 125`. */
	label?: string;
	size?: ScoreStackSize;
	align?: "start" | "end";
	/** `inverse` inherits the current text color for dark surfaces. */
	tone?: "default" | "inverse";
	/** Color the percentage by its score band. Ignored when `tone` is `inverse`. */
	banded?: boolean;
	className?: string;
};

/**
 * The percentage-first score display used everywhere a score appears.
 *
 * The percentage is the headline and the raw fraction sits beneath it, muted.
 * Keeping them on separate lines is the point: a reader scanning a column of
 * scores compares percentages down the column, and an inline fraction breaks
 * that scan. Plain-text contexts that cannot stack (PDF cells, aria-labels) use
 * `formatScoreSummary` from `@/lib/score-format` instead.
 *
 * An unavailable percentage renders `SCORE_UNAVAILABLE`, never a fabricated 0%.
 */
function ScoreStack({
	value,
	max,
	fractionDigits = 0,
	label,
	size = "md",
	align = "start",
	tone = "default",
	banded = false,
	className
}: ScoreStackProps) {
	const percent = scorePercent(value, max);
	const fraction = formatScoreFraction(value, max, fractionDigits);
	const inverse = tone === "inverse";
	const mutedClass = inverse ? "text-current opacity-70" : "text-muted-foreground";
	const headlineClass =
		percent === null ? mutedClass : inverse ? "text-current" : banded ? scoreBand(percent).text : "text-foreground";
	const detail = [label, fraction === SCORE_UNAVAILABLE ? null : fraction].filter(Boolean).join(" ");
	const summary = formatScoreSummary(value, max, fractionDigits);
	const accessibleSummary = label ? `${label}: ${summary}` : summary;

	return (
		<span
			aria-label={accessibleSummary}
			className={cn("flex flex-col gap-0.5 tabular-nums", align === "end" && "items-end text-right", className)}>
			<span className={cn("font-semibold leading-none", PERCENT_CLASSES[size], headlineClass)}>
				{percent === null ? SCORE_UNAVAILABLE : `${percent}%`}
			</span>
			{detail ? (
				<span className={cn("font-normal leading-tight", DETAIL_CLASSES[size], mutedClass)}>{detail}</span>
			) : null}
		</span>
	);
}

export { ScoreStack };
export type { ScoreStackProps };
