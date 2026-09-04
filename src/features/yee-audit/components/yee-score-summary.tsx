import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreStack } from "@/components/ui/score-stack";
import type { YeeScoreResult, YeeDomainKey } from "@/features/yee-audit/config/yee-audit-config";
import { yeeDomainThemes } from "@/features/yee-audit/config/yee-domain-theme";
import { getScoreRows } from "@/features/yee-audit/scoring/yee-scoring";
import { scoreBand } from "@/lib/score-band";
import { SCORE_UNAVAILABLE, scorePercent } from "@/lib/score-format";

const rangeBands = [
	{ label: "Lower range", range: "0–33%", dot: "bg-score-low-fill" },
	{ label: "Middle range", range: "34–66%", dot: "bg-score-mid-fill" },
	{ label: "Upper range", range: "67–100%", dot: "bg-score-high-fill" }
];

type ScoreRow = ReturnType<typeof getScoreRows>[number];

/** A section that has a usable percentage — sections without one are never ranked. */
type ScoreExtreme = { row: ScoreRow; percentage: number };

function clampPercentage(value: number) {
	return Math.max(0, Math.min(100, value));
}

function bandFillClass(percentage: number) {
	return scoreBand(percentage).fill;
}

function findScoreExtremes(rows: ScoreRow[], mode: "raw" | "weighted") {
	const scoredRows = rows
		.map(row => ({
			row,
			percentage: scorePercent(
				mode === "raw" ? row.rawScore : row.weightedScore,
				mode === "raw" ? row.rawMaximum : row.weightedMaximum
			)
		}))
		.filter((entry): entry is ScoreExtreme => entry.percentage !== null);
	if (scoredRows.length === 0) return { highest: null, lowest: null };
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
		<div className={`w-full overflow-hidden rounded-full bg-muted ${className}`}>
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
	fractionDigits = 0,
	footnote,
	tone
}: {
	label: string;
	value?: number | null;
	maximum?: number | null;
	fractionDigits?: number;
	footnote: string;
	tone: "raw" | "weighted";
}) {
	// The maximum is absent at runtime while the backend scoring rollout lands
	// (see YeeScoreResult) — show that the score is unknown instead of 0%.
	const percentage = scorePercent(value, maximum);
	const panelClasses = tone === "weighted" ? "border-score-high/30 bg-score-high-bg/60" : "border-border bg-muted/30";
	const labelClasses = tone === "weighted" ? "text-score-high" : "text-muted-foreground";
	const footnoteClasses = tone === "weighted" ? "text-score-high/80" : "text-muted-foreground";

	return (
		<div className={`rounded-md border p-5 report-no-break ${panelClasses}`}>
			<p className={`text-xs font-medium uppercase tracking-[0.14em] ${labelClasses}`}>{label}</p>
			<ScoreStack value={value} max={maximum} fractionDigits={fractionDigits} size="xl" banded className="mt-3" />
			<div className="mt-4">
				{percentage === null ? (
					<div className="h-2 w-full rounded-full bg-muted" />
				) : (
					<ProgressBar percentage={percentage} />
				)}
			</div>
			<p className={`mt-3 text-xs leading-5 ${footnoteClasses}`}>{footnote}</p>
		</div>
	);
}

/** Percentage-first section score: bold percent, muted fraction, band-coloured bar. */
function SectionScoreCell({
	value,
	maximum,
	fractionDigits = 0
}: {
	value: number;
	maximum: number;
	fractionDigits?: number;
}) {
	const percentage = scorePercent(value, maximum);
	if (percentage === null) {
		return <span className="block text-right text-muted-foreground tabular-nums">{SCORE_UNAVAILABLE}</span>;
	}
	return (
		<span className="flex items-center justify-end gap-2.5">
			<ScoreStack value={value} max={maximum} fractionDigits={fractionDigits} size="sm" align="end" />
			<span className="hidden w-16 sm:block">
				<ProgressBar percentage={percentage} className="h-1.5" />
			</span>
		</span>
	);
}

function ExtremeRow({ label, entry, mutedClass }: { label: string; entry: ScoreExtreme | null; mutedClass: string }) {
	return (
		<div className="flex items-center justify-between gap-3">
			<dt className={mutedClass}>{label}</dt>
			<dd className="flex items-center gap-2 font-medium text-foreground">
				{entry ? (
					<>
						<DomainDot domain={entry.row.domain} />
						{entry.row.label}
						<span className={`${mutedClass} tabular-nums`}>{entry.percentage}%</span>
					</>
				) : (
					<span className={`${mutedClass} tabular-nums`}>{SCORE_UNAVAILABLE}</span>
				)}
			</dd>
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
						value={score.total_raw_score}
						maximum={totalRawScoreMaximum}
						footnote="Share of the available raw score achieved across the full audit."
						tone="raw"
					/>
					<TotalScorePanel
						label="Total Youth-Weighted Average"
						value={score.total_weighted_score}
						maximum={youthWeightedMax}
						fractionDigits={2}
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
									<th className="px-4 py-3 text-right font-medium">Raw</th>
									<th className="px-4 py-3 text-right font-medium">Youth-weighted</th>
								</tr>
							</thead>
							<tbody>
								{rows.map(row => (
									<tr
										key={row.domain}
										className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30">
										<td className="px-4 py-3.5">
											<span className="flex items-center gap-2.5 font-medium text-foreground">
												<DomainDot domain={row.domain} />
												{row.label}
											</span>
										</td>
										<td className="px-4 py-3.5">
											<SectionScoreCell value={row.rawScore} maximum={row.rawMaximum} />
										</td>
										<td className="px-4 py-3.5">
											<SectionScoreCell
												value={row.weightedScore}
												maximum={row.weightedMaximum}
												fractionDigits={2}
											/>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* Highlights */}
				<div className="grid gap-4 md:grid-cols-2 report-no-break report-print-stack">
					<div className="rounded-md border border-border bg-muted/30 p-5 report-no-break">
						<p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
							Raw score range
						</p>
						<dl className="mt-3 space-y-2 text-sm">
							<ExtremeRow
								label="Highest section"
								entry={rawExtremes.highest}
								mutedClass="text-muted-foreground"
							/>
							<ExtremeRow
								label="Lowest section"
								entry={rawExtremes.lowest}
								mutedClass="text-muted-foreground"
							/>
						</dl>
					</div>
					<div className="rounded-md border border-score-high/30 bg-score-high-bg/60 p-5 report-no-break">
						<p className="text-xs font-medium uppercase tracking-[0.14em] text-score-high">
							Youth-weighted range
						</p>
						<dl className="mt-3 space-y-2 text-sm">
							<ExtremeRow
								label="Highest section"
								entry={weightedExtremes.highest}
								mutedClass="text-score-high/80"
							/>
							<ExtremeRow
								label="Lowest section"
								entry={weightedExtremes.lowest}
								mutedClass="text-score-high/80"
							/>
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
