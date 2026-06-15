import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { YeeScorePreview, YeeDomainKey } from "@/lib/yee-audit-config";
import { yeeDomainThemes } from "@/lib/yee-domain-theme";
import { getScoreRows } from "@/lib/yee-scoring";
import {
	getDomainYouthWeightedMaximum,
	getYouthWeightedScoreMaximum,
	rawDomainScoreMaximums,
	totalRawScoreMaximum
} from "@/lib/yee-score-limits";

const rawPalette = {
	fill: "bg-slate-700",
	track: "bg-slate-200",
	text: "text-slate-700",
	panel: "border-slate-200 bg-white"
};

const youthPalette = {
	fill: "bg-emerald-600",
	track: "bg-emerald-100",
	text: "text-emerald-800",
	panel: "border-emerald-300 bg-emerald-100/80"
};

const domainPalette: Record<YeeDomainKey, { fill: string; border: string; text: string }> = {
	access: {
		fill: yeeDomainThemes.access.fillClass,
		border: yeeDomainThemes.access.borderClass,
		text: yeeDomainThemes.access.textClass
	},
	activitySpaces: {
		fill: yeeDomainThemes.activitySpaces.fillClass,
		border: yeeDomainThemes.activitySpaces.borderClass,
		text: yeeDomainThemes.activitySpaces.textClass
	},
	amenities: {
		fill: yeeDomainThemes.amenities.fillClass,
		border: yeeDomainThemes.amenities.borderClass,
		text: yeeDomainThemes.amenities.textClass
	},
	experienceOfSpace: {
		fill: yeeDomainThemes.experienceOfSpace.fillClass,
		border: yeeDomainThemes.experienceOfSpace.borderClass,
		text: yeeDomainThemes.experienceOfSpace.textClass
	},
	aestheticsAndCare: {
		fill: yeeDomainThemes.aestheticsAndCare.fillClass,
		border: yeeDomainThemes.aestheticsAndCare.borderClass,
		text: yeeDomainThemes.aestheticsAndCare.textClass
	},
	useAndUsability: {
		fill: yeeDomainThemes.useAndUsability.fillClass,
		border: yeeDomainThemes.useAndUsability.borderClass,
		text: yeeDomainThemes.useAndUsability.textClass
	}
};

function clampPercentage(value: number) {
	return Math.max(0, Math.min(100, value));
}

function barHeight(value: number) {
	return `${Math.max(10, clampPercentage(value))}%`;
}

function colorBand(percentage: number) {
	if (percentage < 34) return "bg-rose-400";
	if (percentage < 67) return "bg-amber-400";
	return "bg-emerald-500";
}

function findScoreExtremes(
	rows: ReturnType<typeof getScoreRows>,
	mode: "raw" | "weighted",
	preview: YeeScorePreview
) {
	const scoredRows = rows.map(row => {
		const maximum =
			mode === "raw"
				? rawDomainScoreMaximums[row.domain]
				: getDomainYouthWeightedMaximum(row.domain, preview.selectedWeights);
		const value = mode === "raw" ? row.rawScore : row.weightedScore;
		const percentage = maximum > 0 ? (value / maximum) * 100 : 0;
		return { row, value, maximum, percentage };
	});
	const highest = scoredRows.reduce((best, current) => (current.percentage > best.percentage ? current : best), scoredRows[0]);
	const lowest = scoredRows.reduce((best, current) => (current.percentage < best.percentage ? current : best), scoredRows[0]);
	return { highest, lowest };
}

export function YeeScoreSummary({
	preview,
	title,
	description
}: {
	preview: YeeScorePreview;
	title: string;
	description: string;
}) {
	const rows = getScoreRows(preview);
	const youthWeightedMax = getYouthWeightedScoreMaximum(preview.selectedWeights);
	const totalRawPercentage = totalRawScoreMaximum ? (preview.totalRawScore / totalRawScoreMaximum) * 100 : 0;
	const totalYouthPercentage = youthWeightedMax ? (preview.totalWeightedScore / youthWeightedMax) * 100 : 0;
	const rawExtremes = findScoreExtremes(rows, "raw", preview);
	const weightedExtremes = findScoreExtremes(rows, "weighted", preview);

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="overflow-x-auto report-no-break">
					<table className="min-w-full text-sm">
						<thead className="text-slate-500">
							<tr className="border-b border-slate-200">
								<th className="py-3 pr-4 text-left font-medium">Section</th>
								<th className="px-3 py-3 text-center font-medium">Raw Section Score</th>
								<th className="px-3 py-3 text-center font-medium">Raw %</th>
								<th className="px-3 py-3 text-center font-medium">
									<span className="inline-block max-w-[8rem] whitespace-normal leading-5">
										Youth-Weighted Section Average
									</span>
								</th>
								<th className="px-3 py-3 text-center font-medium">Youth-Weighted %</th>
							</tr>
						</thead>
						<tbody>
							{rows.map(row => {
								const rawMax = rawDomainScoreMaximums[row.domain];
								const weightedMax = getDomainYouthWeightedMaximum(row.domain, preview.selectedWeights);
								const rawPercentage = rawMax ? (row.rawScore / rawMax) * 100 : 0;
								const weightedPercentage = weightedMax ? (row.weightedScore / weightedMax) * 100 : 0;
								return (
								<tr key={row.domain} className="border-b border-slate-100 last:border-0">
									<td className="py-4 pr-4 text-left font-medium text-slate-900">{row.label}</td>
									<td className="px-3 py-4 text-center text-slate-600">
										{row.rawScore} / {rawMax}
									</td>
									<td className="px-3 py-4 text-center text-slate-600">{rawPercentage.toFixed(0)}% ({row.rawScore}/{rawMax})</td>
									<td className="px-3 py-4 text-center text-slate-600">
										{row.weightedScore} / {weightedMax}
									</td>
									<td className="px-3 py-4 text-center text-slate-600">{weightedPercentage.toFixed(0)}% ({row.weightedScore}/{weightedMax})</td>
								</tr>
								);
							})}
						</tbody>
					</table>
				</div>
				<div className="grid gap-4 md:grid-cols-2 report-no-break">
					<div className="rounded-2xl bg-slate-50 p-4 report-no-break">
						<p className="text-sm text-slate-500">Total Enabling Environment Raw Score</p>
						<p className="mt-2 text-2xl font-semibold text-slate-950">
							{preview.totalRawScore} / {totalRawScoreMaximum} <span className="text-lg text-slate-600">({totalRawPercentage.toFixed(0)}%)</span>
						</p>
						<p className="mt-2 text-xs text-slate-500">
							This percentage shows how much of the available raw score was achieved across the full audit.
						</p>
					</div>
					<div className="rounded-2xl bg-emerald-100/80 p-4 report-no-break">
						<p className="text-sm text-emerald-700">Total Enabling Environment Youth Weighted Average</p>
						<p className="mt-2 text-2xl font-semibold text-emerald-900">
							{preview.totalWeightedScore} / {youthWeightedMax} <span className="text-lg text-emerald-700">({totalYouthPercentage.toFixed(0)}%)</span>
						</p>
						<p className="mt-2 text-xs text-emerald-700/80">
							This Youth Weighted maximum is based on normalized domain weights and each domain&apos;s maximum average value.
						</p>
					</div>
				</div>
				<div className="rounded-2xl border border-slate-200 bg-[#f8fbf9] p-4 text-sm text-slate-600 report-no-break">
					<p className="font-medium text-slate-900">How to read these graphs</p>
					<p className="mt-2">
						Each bar represents 100% of the available score for that section. The colored fill shows how much of that available score was reached. Raw and Youth Weighted percentages are shown separately because they answer slightly different questions about the same audit.
					</p>
					<div className="mt-4 grid gap-3 md:grid-cols-3">
						{[
							{ label: "Lower range", tone: "bg-rose-400", text: "0% to 33% of the available score" },
							{ label: "Middle range", tone: "bg-amber-400", text: "34% to 66% of the available score" },
							{ label: "Upper range", tone: "bg-emerald-500", text: "67% to 100% of the available score" }
						].map(entry => (
							<div key={entry.label} className="rounded-2xl border border-slate-200 bg-white p-3 report-no-break">
								<div className="flex items-center gap-2">
									<span className={`h-3 w-3 rounded-full ${entry.tone}`} />
									<p className="text-sm font-medium text-slate-900">{entry.label}</p>
								</div>
								<p className="mt-2 text-xs text-slate-600">{entry.text}</p>
							</div>
						))}
					</div>
				</div>
				<div className="space-y-6">
					<div className={`space-y-4 rounded-2xl border p-4 report-no-break ${rawPalette.panel}`}>
						<p className="text-sm font-medium text-slate-900">Raw score by section</p>
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
							{rows.map(row => {
								const rawMax = rawDomainScoreMaximums[row.domain];
								const rawPercentage = rawMax ? (row.rawScore / rawMax) * 100 : 0;
								const palette = domainPalette[row.domain];
								return (
									<div
										key={`${row.domain}-raw`}
										className={`rounded-[1.25rem] border-[3px] px-3 py-4 report-no-break ${palette.border}`}
										style={{ backgroundColor: yeeDomainThemes[row.domain].lightHex }}
									>
										<div className="space-y-1">
											<p className={`text-sm font-semibold ${palette.text}`}>{row.label}</p>
											<p className={`text-xs ${rawPalette.text}`}>Raw score</p>
											<p className="text-center text-sm font-medium text-slate-900">
												{row.rawScore} / {rawMax} ({rawPercentage.toFixed(0)}%)
											</p>
										</div>
										<div className="mt-4 flex justify-center">
											<div className="flex h-28 w-9 items-end rounded-xl border border-slate-200 bg-white/80 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
												<div className={`w-full rounded-md ${colorBand(rawPercentage)}`} style={{ height: barHeight(rawPercentage) }} />
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
					<div className={`space-y-4 rounded-2xl border p-4 report-no-break ${youthPalette.panel}`}>
						<p className="text-sm font-medium text-emerald-900">Youth-Weighted average by section</p>
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
							{rows.map(row => {
								const weightedMax = getDomainYouthWeightedMaximum(row.domain, preview.selectedWeights);
								const weightedPercentage = weightedMax ? (row.weightedScore / weightedMax) * 100 : 0;
								const palette = domainPalette[row.domain];
								return (
									<div
										key={`${row.domain}-weighted`}
										className={`rounded-[1.25rem] border-[3px] px-3 py-4 report-no-break ${palette.border}`}
										style={{ backgroundColor: yeeDomainThemes[row.domain].lightHex }}
									>
										<div className="space-y-1">
											<p className={`text-sm font-semibold ${palette.text}`}>{row.label}</p>
											<p className={`mt-1 text-xs ${youthPalette.text}`}>Youth-Weighted average</p>
											<p className="text-center text-sm font-medium text-slate-900">
												{row.weightedScore} / {weightedMax} ({weightedPercentage.toFixed(0)}%)
											</p>
										</div>
										<div className="mt-4 flex justify-center">
											<div className="flex h-28 w-9 items-end rounded-xl border border-slate-200 bg-white/80 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
												<div className={`w-full rounded-md ${colorBand(weightedPercentage)}`} style={{ height: barHeight(weightedPercentage) }} />
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
					<div className="grid gap-4 md:grid-cols-2 report-no-break">
						<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 report-no-break">
							<p className="text-sm font-medium text-slate-900">Highest and lowest raw score sections</p>
							<p className="mt-2 text-sm text-slate-600">
								Highest: <span className="font-medium text-slate-900">{rawExtremes.highest.row.label}</span> ({rawExtremes.highest.percentage.toFixed(0)}%)
							</p>
							<p className="mt-1 text-sm text-slate-600">
								Lowest: <span className="font-medium text-slate-900">{rawExtremes.lowest.row.label}</span> ({rawExtremes.lowest.percentage.toFixed(0)}%)
							</p>
						</div>
						<div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 report-no-break">
							<p className="text-sm font-medium text-emerald-900">Highest and lowest Youth-Weighted sections</p>
							<p className="mt-2 text-sm text-emerald-800">
								Highest: <span className="font-medium text-emerald-950">{weightedExtremes.highest.row.label}</span> ({weightedExtremes.highest.percentage.toFixed(0)}%)
							</p>
							<p className="mt-1 text-sm text-emerald-800">
								Lowest: <span className="font-medium text-emerald-950">{weightedExtremes.lowest.row.label}</span> ({weightedExtremes.lowest.percentage.toFixed(0)}%)
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
