import { scoreBand, scoreTrackLength } from "@/lib/score-band";
import { SCORE_UNAVAILABLE } from "@/lib/score-format";
import { cn } from "@/lib/utils";

type ScoreBarProps = {
	/** Whole-number percentage, or `null` when the score is unavailable. */
	percent: number | null;
	/** Short series name shown in the gutter, e.g. `Raw`. */
	seriesLabel: string;
	/** Secondary figure after the percentage, e.g. `37 / 122`. */
	detail?: string;
	className?: string;
};

/**
 * One horizontal score bar drawn on a shared 0–100% baseline.
 *
 * Horizontal and full-width on purpose. The vertical pill this replaces sat
 * inside its own bordered box, one box per audit, so a reader comparing eleven
 * audits had no common baseline to scan down — which is the only thing a
 * comparison view exists to provide. Stacking these rows gives every audit the
 * same left edge and the same scale.
 *
 * The bar is `aria-hidden`: the percentage and its fraction sit beside it as
 * real text, so a screen reader gets the value once rather than twice.
 */
function ScoreBar({ percent, seriesLabel, detail, className }: ScoreBarProps) {
	const band = percent === null ? null : scoreBand(percent);
	const trackLength = percent === null ? null : scoreTrackLength(percent);
	return (
		<div className={cn("flex items-center gap-3", className)}>
			<span className="w-12 shrink-0 text-xs text-muted-foreground">{seriesLabel}</span>
			<span aria-hidden className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
				{band === null || trackLength === null ? null : (
					<span className={cn("block h-full rounded-full", band.fill)} style={{ width: trackLength }} />
				)}
			</span>
			{/* Fixed width and nowrap: the youth-weighted fraction ("1.86 / 2.24")
			    is the widest thing that lands here, and letting it wrap broke the
			    row's baseline alignment down the column. */}
			<span className="flex w-28 shrink-0 items-baseline justify-end gap-1.5 whitespace-nowrap tabular-nums">
				<span className="text-sm font-semibold text-foreground">
					{percent === null ? SCORE_UNAVAILABLE : `${percent}%`}
				</span>
				{detail && percent !== null ? <span className="text-xs text-muted-foreground">{detail}</span> : null}
			</span>
		</div>
	);
}

export { ScoreBar };
export type { ScoreBarProps };
