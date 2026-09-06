import { SCORE_UNAVAILABLE } from "@/lib/score-format";
import { cn } from "@/lib/utils";

type ScoreMicroProps = {
	readonly percent: number | null;
	readonly fraction: string;
	readonly label: string;
	readonly detail?: string;
	readonly align?: "start" | "end";
	readonly className?: string;
};

function ScoreMicro({ percent, fraction, label, detail, align = "start", className }: ScoreMicroProps) {
	const available = percent !== null;
	const secondary = detail ?? (fraction === SCORE_UNAVAILABLE ? null : fraction);
	const summary = available
		? `${percent}%${secondary ? ` (${secondary})` : ""}`
		: `${SCORE_UNAVAILABLE}${secondary ? ` (${secondary})` : ""}`;

	return (
		<span
			className={cn("flex flex-col gap-0.5 tabular-nums", align === "end" && "items-end text-right", className)}>
			<span className="sr-only">
				{label}: {summary}
			</span>
			<span
				aria-hidden="true"
				className={cn("font-semibold leading-none", available ? "text-foreground" : "text-muted-foreground")}>
				{available ? `${percent}%` : SCORE_UNAVAILABLE}
			</span>
			{secondary ? (
				<span aria-hidden="true" className="text-xs leading-tight text-muted-foreground">
					{secondary}
				</span>
			) : null}
		</span>
	);
}

export { ScoreMicro };
export type { ScoreMicroProps };
