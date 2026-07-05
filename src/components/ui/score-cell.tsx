import { cn } from "@/lib/utils";

const EM_DASH = "—";

/** Percent of a value against a maximum, guarded against missing/zero inputs. */
function toPercent(value?: number | null, max?: number | null): string | null {
	if (value == null || max == null || max === 0) return null;
	return `${Math.round((value / max) * 100)}%`;
}

/** Two-decimal weighted figure, or an em dash when the field is absent. */
function formatWeighted(value?: number | null): string {
	return value == null ? EM_DASH : value.toFixed(2);
}

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
 * (tables, cards, detail pages, reports). Missing values render as an em
 * dash instead of throwing — weighted fields are absent during the backend
 * scoring rollout, which previously crashed the auditor dashboard.
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
	const rawPercent = toPercent(raw, rawMax);
	const weightedPercent = toPercent(weighted, weightedMax);
	const inverse = tone === "inverse";

	return (
		<div
			className={cn(
				"flex flex-col gap-0.5 text-sm tabular-nums",
				align === "end" && "items-end text-right",
				className
			)}>
			{showRaw ? (
				<span className={cn("font-medium", inverse ? "text-current" : "text-foreground")}>
					{raw == null || rawMax == null ? (
						<span className={inverse ? "opacity-70" : "text-muted-foreground"}>{EM_DASH}</span>
					) : (
						<>
							Raw: {raw} / {rawMax}
							{rawPercent ? (
								<span className={inverse ? "opacity-70" : "text-muted-foreground"}>
									{" "}
									({rawPercent})
								</span>
							) : null}
						</>
					)}
				</span>
			) : null}
			{showWeighted ? (
				<span className={inverse ? "text-current opacity-80" : "text-muted-foreground"}>
					Youth Weighted: {formatWeighted(weighted)} / {formatWeighted(weightedMax)}
					{weightedPercent ? ` (${weightedPercent})` : null}
				</span>
			) : null}
		</div>
	);
}

export { ScoreCell };
export type { ScoreCellProps };
