import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { YeeScorePreview, YeeDomainKey } from "@/lib/yee-audit-config";
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
	panel: "border-slate-200 bg-[#f8fbf9]"
};

const youthPalette = {
	fill: "bg-emerald-600",
	track: "bg-emerald-100",
	text: "text-emerald-800",
	panel: "border-emerald-200 bg-emerald-50/70"
};

const domainPalette: Record<YeeDomainKey, { fill: string; soft: string; border: string; text: string }> = {
	access: {
		fill: "bg-emerald-500",
		soft: "bg-emerald-100/80",
		border: "border-emerald-200",
		text: "text-emerald-900"
	},
	activitySpaces: {
		fill: "bg-sky-500",
		soft: "bg-sky-100/80",
		border: "border-sky-200",
		text: "text-sky-900"
	},
	amenities: {
		fill: "bg-amber-500",
		soft: "bg-amber-100/80",
		border: "border-amber-200",
		text: "text-amber-900"
	},
	experienceOfSpace: {
		fill: "bg-teal-500",
		soft: "bg-teal-100/80",
		border: "border-teal-200",
		text: "text-teal-900"
	},
	aestheticsAndCare: {
		fill: "bg-rose-400",
		soft: "bg-rose-100/80",
		border: "border-rose-200",
		text: "text-rose-900"
	},
	useAndUsability: {
		fill: "bg-violet-500",
		soft: "bg-violet-100/80",
		border: "border-violet-200",
		text: "text-violet-900"
	}
};

function clampPercentage(value: number) {
	return Math.max(0, Math.min(100, value));
}

function barHeight(value: number) {
	return `${Math.max(12, clampPercentage(value))}%`;
}

function colorBand(percentage: number) {
	if (percentage < 34) {
		return {
			fill: "bg-rose-400",
			label: "Lower range",
			description: "This score is in the lower third of the available range."
		};
	}
	if (percentage < 67) {
		return {
			fill: "bg-amber-400",
			label: "Middle range",
			description: "This score is in the middle third of the available range."
		};
	}
	return {
		fill: "bg-emerald-500",
		label: "Upper range",
		description: "This score is in the upper third of the available range."
	};
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

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="overflow-x-auto">
					<table className="min-w-full text-left text-sm">
						<thead className="text-slate-500">
							<tr className="border-b border-slate-200">
								<th className="py-3 pr-4 font-medium">Domain</th>
								<th className="py-3 pr-4 font-medium">Raw Domain Score</th>
								<th className="py-3 pr-4 font-medium">Raw %</th>
								<th className="py-3 pr-4 font-medium">Youth Weighted Domain Score</th>
								<th className="py-3 font-medium">Youth Weighted %</th>
							</tr>
						</thead>
						<tbody>
							{rows.map(row => {
								const rawMax = rawDomainScoreMaximums[row.domain];
								const weightedMax = getDomainYouthWeightedMaximum(row.domain, preview.selectedWeights[row.domain]);
								const rawPercentage = rawMax ? (row.rawScore / rawMax) * 100 : 0;
								const weightedPercentage = weightedMax ? (row.weightedScore / weightedMax) * 100 : 0;
								return (
								<tr key={row.domain} className="border-b border-slate-100 last:border-0">
									<td className="py-4 pr-4 font-medium text-slate-900">{row.label}</td>
									<td className="py-4 pr-4 text-slate-600">
										{row.rawScore} / {rawMax}
									</td>
									<td className="py-4 pr-4 text-slate-600">{rawPercentage.toFixed(0)}%</td>
									<td className="py-4 pr-4 text-slate-600">
										{row.weightedScore} / {weightedMax}
									</td>
									<td className="py-4 text-slate-600">{weightedPercentage.toFixed(0)}%</td>
								</tr>
								);
							})}
						</tbody>
					</table>
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded-2xl bg-slate-50 p-4">
						<p className="text-sm text-slate-500">Total Enabling Environment Raw Score</p>
						<p className="mt-2 text-2xl font-semibold text-slate-950">
							{preview.totalRawScore} / {totalRawScoreMaximum}
						</p>
						<p className="mt-1 text-sm font-medium text-slate-700">{totalRawPercentage.toFixed(0)}%</p>
						<p className="mt-2 text-xs text-slate-500">
							This percentage shows how much of the available raw score was achieved across the full audit.
						</p>
					</div>
					<div className="rounded-2xl bg-emerald-50 p-4">
						<p className="text-sm text-emerald-700">Total Enabling Environment Youth Weighted Score</p>
						<p className="mt-2 text-2xl font-semibold text-emerald-900">
							{preview.totalWeightedScore} / {youthWeightedMax}
						</p>
						<p className="mt-1 text-sm font-medium text-emerald-800">{totalYouthPercentage.toFixed(0)}%</p>
						<p className="mt-2 text-xs text-emerald-700/80">
							This Youth Weighted maximum is based on the domain weights selected earlier in the audit.
						</p>
					</div>
				</div>
				<div className="rounded-2xl border border-slate-200 bg-[#f8fbf9] p-4 text-sm text-slate-600">
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
							<div key={entry.label} className="rounded-2xl border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2">
									<span className={`h-3 w-3 rounded-full ${entry.tone}`} />
									<p className="text-sm font-medium text-slate-900">{entry.label}</p>
								</div>
								<p className="mt-2 text-xs text-slate-600">{entry.text}</p>
							</div>
						))}
					</div>
				</div>
				<div className="grid gap-6 lg:grid-cols-2">
					<div className={`space-y-4 rounded-2xl border p-4 ${rawPalette.panel}`}>
						<p className="text-sm font-medium text-slate-900">Raw score by domain</p>
						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
							{rows.map(row => {
								const rawMax = rawDomainScoreMaximums[row.domain];
								const rawPercentage = rawMax ? (row.rawScore / rawMax) * 100 : 0;
								const palette = domainPalette[row.domain];
								const band = colorBand(rawPercentage);
								return (
									<div key={`${row.domain}-raw`} className={`rounded-[1.5rem] border p-4 ${palette.border} ${palette.soft}`}>
										<div className="flex items-start justify-between gap-3">
											<div>
												<p className={`text-sm font-semibold ${palette.text}`}>{row.label}</p>
												<p className={`mt-1 text-xs ${rawPalette.text}`}>Raw score</p>
											</div>
											<p className={`text-sm font-semibold ${palette.text}`}>{rawPercentage.toFixed(0)}%</p>
										</div>
										<div className="mt-4 flex items-end gap-4">
											<div className="flex h-40 w-14 items-end rounded-full border border-white/70 bg-white/80 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
												<div className={`w-full rounded-full ${band.fill}`} style={{ height: barHeight(rawPercentage) }} />
											</div>
											<div className="space-y-1 text-xs text-slate-600">
												<p className="font-medium text-slate-900">{row.rawScore} / {rawMax}</p>
												<p>{band.label}</p>
												<p>{band.description}</p>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
					<div className={`space-y-4 rounded-2xl border p-4 ${youthPalette.panel}`}>
						<p className="text-sm font-medium text-emerald-900">Youth Weighted score by domain</p>
						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
							{rows.map(row => {
								const weightedMax = getDomainYouthWeightedMaximum(row.domain, preview.selectedWeights[row.domain]);
								const weightedPercentage = weightedMax ? (row.weightedScore / weightedMax) * 100 : 0;
								const palette = domainPalette[row.domain];
								const band = colorBand(weightedPercentage);
								return (
									<div key={`${row.domain}-weighted`} className={`rounded-[1.5rem] border p-4 ${palette.border} ${palette.soft}`}>
										<div className="flex items-start justify-between gap-3">
											<div>
												<p className={`text-sm font-semibold ${palette.text}`}>{row.label}</p>
												<p className={`mt-1 text-xs ${youthPalette.text}`}>Youth Weighted score</p>
											</div>
											<p className={`text-sm font-semibold ${palette.text}`}>{weightedPercentage.toFixed(0)}%</p>
										</div>
										<div className="mt-4 flex items-end gap-4">
											<div className="flex h-40 w-14 items-end rounded-full border border-white/70 bg-white/80 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
												<div className={`w-full rounded-full ${band.fill}`} style={{ height: barHeight(weightedPercentage) }} />
											</div>
											<div className="space-y-1 text-xs text-slate-600">
												<p className="font-medium text-slate-900">{row.weightedScore} / {weightedMax}</p>
												<p>{band.label}</p>
												<p>{band.description}</p>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
