import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { YeeScoreResult, YeeDomainKey } from "@/features/yee-audit/config/yee-audit-config";
import { yeeDomainThemes } from "@/features/yee-audit/config/yee-domain-theme";
import { getScoreRows } from "@/features/yee-audit/scoring/yee-scoring";

const rangeBands = [
	{ label: "Lower range", range: "0–33%", dot: "bg-rose-400" },
	{ label: "Middle range", range: "34–66%", dot: "bg-amber-400" },
	{ label: "Upper range", range: "67–100%", dot: "bg-emerald-500" }
];

function clampPercentage(value: number) {
	return Math.max(0, Math.min(100, value));
}

function bandFillClass(percentage: number) {
	if (percentage < 34) return "bg-rose-400";
	if (percentage < 67) return "bg-amber-400";
	return "bg-emerald-500";
}

function bandTextClass(percentage: number) {
	if (percentage < 34) return "text-rose-700";
	if (percentage < 67) return "text-amber-700";
	return "text-emerald-700";
}

function findScoreExtremes(rows: ReturnType<typeof getScoreRows>, mode: "raw" | "weighted") {
	const scoredRows = rows.map(row => {
		const maximum = mode === "raw" ? row.rawMaximum : row.weightedMaximum;
		const value = mode === "raw" ? row.rawScore : row.weightedScore;
		const percentage = maximum > 0 ? (value / maximum) * 100 : 0;
		return { row, value, maximum, percentage };
	});
	const highest = scoredRows.reduce(
		(best, current) => (current.percentage > best.percentage ? current : best),
		scoredRows[0]
	);
	const lowest = scoredRows.reduce(
		(best, current) => (current.percentage < best.percentage ? current : best),
		scoredRows[0]
	);
	return { highest, lowest };
}

function ProgressBar({ percentage, className = "h-2" }: { percentage: number; className?: string }) {
	const clamped = clampPercentage(percentage);
	return (
		<div className={`w-full overflow-hidden rounded-full bg-slate-200/70 ${className}`}>
			<div
				className={`h-full rounded-full transition-[width] duration-500 ${bandFillClass(clamped)}`}
				style={{ width: `${Math.max(clamped, 1.5)}%` }}
			/>
		</div>
	);
}

function DomainDot({ domain }: { domain: YeeDomainKey }) {
	return (
		<span
			aria-hidden
			className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
			style={{ backgroundColor: yeeDomainThemes[domain].strongHex }}
		/>
	);
}

function TotalScorePanel({
	label,
	value,
	maximum,
	percentage,
	footnote,
	tone
}: {
	label: string;
	value: string;
	maximum: string;
	percentage: number;
	footnote: string;
	tone: "raw" | "weighted";
}) {
	const panelClasses = tone === "weighted" ? "border-emerald-200 bg-emerald-50/60" : "border-border bg-muted/30";
	const labelClasses = tone === "weighted" ? "text-emerald-800" : "text-muted-foreground";
	const footnoteClasses = tone === "weighted" ? "text-emerald-700/80" : "text-muted-foreground";

	return (
		<div className={`rounded-md border p-5 report-no-break ${panelClasses}`}>
			<div className="flex items-center justify-between gap-3">
				<p className={`text-xs font-medium uppercase tracking-[0.14em] ${labelClasses}`}>{label}</p>
				<span
					className={`rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold tabular-nums ${bandTextClass(percentage)}`}>
					{percentage.toFixed(0)}%
				</span>
			</div>
			<p className="mt-3 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
				{value}
				<span className="ml-1.5 text-base font-normal text-muted-foreground tabular-nums">/ {maximum}</span>
			</p>
			<div className="mt-4">
				<ProgressBar percentage={percentage} />
			</div>
			<p className={`mt-3 text-xs leading-5 ${footnoteClasses}`}>{footnote}</p>
		</div>
	);
}

export function YeeScoreSummary({
	score,
	title,
	description
}: {
	score: YeeScoreResult;
	title: string;
	description: string;
}) {
	const rows = getScoreRows(score);
	const totalRawScoreMaximum = score.total_raw_maximum;
	const youthWeightedMax = score.total_weighted_maximum;
	const totalRawPercentage = totalRawScoreMaximum ? (score.total_raw_score / totalRawScoreMaximum) * 100 : 0;
	const totalYouthPercentage = youthWeightedMax ? (score.total_weighted_score / youthWeightedMax) * 100 : 0;
	const rawExtremes = findScoreExtremes(rows, "raw");
	const weightedExtremes = findScoreExtremes(rows, "weighted");

	return (
		<Card className="rounded-md">
			<CardHeader className="border-b [.border-b]:pb-5">
				<CardTitle className="text-lg tracking-tight">{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-8">
				{/* Overall totals */}
				<div className="grid gap-4 md:grid-cols-2 report-no-break report-print-stack">
					<TotalScorePanel
						label="Total Raw Score"
						value={String(score.total_raw_score)}
						maximum={String(totalRawScoreMaximum)}
						percentage={totalRawPercentage}
						footnote="Share of the available raw score achieved across the full audit."
						tone="raw"
					/>
					<TotalScorePanel
						label="Total Youth-Weighted Average"
						value={String(score.total_weighted_score)}
						maximum={String(youthWeightedMax)}
						percentage={totalYouthPercentage}
						footnote="Maximum reflects the normalized domain weights and each domain's maximum average value."
						tone="weighted"
					/>
				</div>

				{/* Section score table */}
				<div className="report-no-break">
					<div className="flex items-baseline justify-between gap-3">
						<h3 className="text-sm font-semibold text-foreground">Scores by section</h3>
						<div className="hidden text-xs text-muted-foreground sm:block">
							<div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
								{rangeBands.map(band => (
									<span
										key={band.label}
										className="flex items-center gap-1.5 text-xs text-muted-foreground">
										<span className={`h-2 w-2 rounded-full ${band.dot}`} />
										{band.label}
										<span className="text-muted-foreground/70 tabular-nums">{band.range}</span>
									</span>
								))}
							</div>
						</div>
					</div>

					<div className="mt-3 overflow-x-auto rounded-md border border-border">
						<table className="min-w-full text-sm">
							<thead>
								<tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
									<th className="px-4 py-3 text-left font-medium">Section</th>
									<th className="px-4 py-3 text-right font-medium">Raw score</th>
									<th className="px-4 py-3 text-right font-medium">Raw %</th>
									<th className="px-4 py-3 text-right font-medium">Youth-weighted</th>
									<th className="px-4 py-3 text-right font-medium">Youth-weighted %</th>
								</tr>
							</thead>
							<tbody>
								{rows.map(row => {
									const rawMax = row.rawMaximum;
									const weightedMax = row.weightedMaximum;
									const rawPercentage = rawMax ? (row.rawScore / rawMax) * 100 : 0;
									const weightedPercentage = weightedMax
										? (row.weightedScore / weightedMax) * 100
										: 0;
									return (
										<tr
											key={row.domain}
											className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30">
											<td className="px-4 py-3.5">
												<span className="flex items-center gap-2.5 font-medium text-foreground">
													<DomainDot domain={row.domain} />
													{row.label}
												</span>
											</td>
											<td className="px-4 py-3.5 text-right text-muted-foreground tabular-nums">
												{row.rawScore} / {rawMax}
											</td>
											<td className="px-4 py-3.5">
												<span className="flex items-center justify-end gap-2.5">
													<span className="font-medium text-foreground tabular-nums">
														{rawPercentage.toFixed(0)}%
													</span>
													<span className="hidden w-16 sm:block">
														<ProgressBar percentage={rawPercentage} className="h-1.5" />
													</span>
												</span>
											</td>
											<td className="px-4 py-3.5 text-right text-muted-foreground tabular-nums">
												{row.weightedScore} / {weightedMax}
											</td>
											<td className="px-4 py-3.5">
												<span className="flex items-center justify-end gap-2.5">
													<span className="font-medium text-foreground tabular-nums">
														{weightedPercentage.toFixed(0)}%
													</span>
													<span className="hidden w-16 sm:block">
														<ProgressBar
															percentage={weightedPercentage}
															className="h-1.5"
														/>
													</span>
												</span>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>

				{/* Section performance bars
				<div className="rounded-md border border-border bg-muted/20 p-5 report-no-break">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h3 className="text-sm font-semibold text-foreground">Section performance</h3>
							<p className="mt-1 text-xs leading-5 text-muted-foreground">
								Each bar spans 100% of that section&apos;s available score. Fill color indicates the
								range reached.
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
							{rangeBands.map(band => (
								<span
									key={band.label}
									className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<span className={`h-2 w-2 rounded-full ${band.dot}`} />
									{band.label}
									<span className="text-muted-foreground/70 tabular-nums">{band.range}</span>
								</span>
							))}
						</div>
					</div>
					<div className="mt-5 space-y-5">
						{rows.map(row => {
							const rawMax = row.rawMaximum;
							const weightedMax = row.weightedMaximum;
							const rawPercentage = rawMax ? (row.rawScore / rawMax) * 100 : 0;
							const weightedPercentage = weightedMax ? (row.weightedScore / weightedMax) * 100 : 0;
							return (
								<div key={row.domain} className="report-no-break">
									<p className="flex items-center gap-2.5 text-sm font-medium text-foreground">
										<DomainDot domain={row.domain} />
										{row.label}
									</p>
									<div className="mt-2 grid gap-x-8 gap-y-2 pl-5 sm:grid-cols-2">
										<div className="flex items-center gap-3">
											<span className="w-28 shrink-0 text-xs text-muted-foreground">Raw</span>
											<ProgressBar percentage={rawPercentage} className="h-2" />
											<span className="w-24 shrink-0 text-right text-xs font-medium text-foreground tabular-nums">
												{row.rawScore}/{rawMax} · {rawPercentage.toFixed(0)}%
											</span>
										</div>
										<div className="flex items-center gap-3">
											<span className="w-28 shrink-0 text-xs text-muted-foreground">
												Youth-weighted
											</span>
											<ProgressBar percentage={weightedPercentage} className="h-2" />
											<span className="w-24 shrink-0 text-right text-xs font-medium text-foreground tabular-nums">
												{row.weightedScore}/{weightedMax} · {weightedPercentage.toFixed(0)}%
											</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div> */}

				{/* Highlights */}
				<div className="grid gap-4 md:grid-cols-2 report-no-break report-print-stack">
					<div className="rounded-md border border-border bg-muted/30 p-5 report-no-break">
						<p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
							Raw score range
						</p>
						<dl className="mt-3 space-y-2 text-sm">
							<div className="flex items-center justify-between gap-3">
								<dt className="text-muted-foreground">Highest section</dt>
								<dd className="flex items-center gap-2 font-medium text-foreground">
									<DomainDot domain={rawExtremes.highest.row.domain} />
									{rawExtremes.highest.row.label}
									<span className="text-muted-foreground tabular-nums">
										{rawExtremes.highest.percentage.toFixed(0)}%
									</span>
								</dd>
							</div>
							<div className="flex items-center justify-between gap-3">
								<dt className="text-muted-foreground">Lowest section</dt>
								<dd className="flex items-center gap-2 font-medium text-foreground">
									<DomainDot domain={rawExtremes.lowest.row.domain} />
									{rawExtremes.lowest.row.label}
									<span className="text-muted-foreground tabular-nums">
										{rawExtremes.lowest.percentage.toFixed(0)}%
									</span>
								</dd>
							</div>
						</dl>
					</div>
					<div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-5 report-no-break">
						<p className="text-xs font-medium uppercase tracking-[0.14em] text-emerald-800">
							Youth-weighted range
						</p>
						<dl className="mt-3 space-y-2 text-sm">
							<div className="flex items-center justify-between gap-3">
								<dt className="text-emerald-800/80">Highest section</dt>
								<dd className="flex items-center gap-2 font-medium text-emerald-950">
									<DomainDot domain={weightedExtremes.highest.row.domain} />
									{weightedExtremes.highest.row.label}
									<span className="text-emerald-800/80 tabular-nums">
										{weightedExtremes.highest.percentage.toFixed(0)}%
									</span>
								</dd>
							</div>
							<div className="flex items-center justify-between gap-3">
								<dt className="text-emerald-800/80">Lowest section</dt>
								<dd className="flex items-center gap-2 font-medium text-emerald-950">
									<DomainDot domain={weightedExtremes.lowest.row.domain} />
									{weightedExtremes.lowest.row.label}
									<span className="text-emerald-800/80 tabular-nums">
										{weightedExtremes.lowest.percentage.toFixed(0)}%
									</span>
								</dd>
							</div>
						</dl>
					</div>
				</div>

				<p className="text-xs leading-5 text-muted-foreground report-no-break">
					Raw and Youth-Weighted percentages are reported separately because they answer slightly different
					questions about the same audit: raw scores describe the environment as observed, while
					Youth-Weighted averages reflect what mattered most to the participant.
				</p>
			</CardContent>
		</Card>
	);
}
