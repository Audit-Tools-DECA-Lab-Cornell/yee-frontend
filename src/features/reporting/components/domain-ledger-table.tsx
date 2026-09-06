import { DomainLabel } from "@/components/ui/domain-badge";
import { ScoreMicro } from "@/components/ui/score-micro";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table";
import type {
	DomainLedgerAverage,
	DomainLedgerAverageScore,
	DomainLedgerMetric,
	DomainLedgerRow
} from "@/features/reporting/domain-ledger-model";
import { domainLabels, domainOrder } from "@/features/reporting/reporting";

type DomainLedgerTableProps = {
	readonly rows: readonly DomainLedgerRow[];
	readonly average: DomainLedgerAverage;
	readonly metric: DomainLedgerMetric;
};

function auditLabel(row: DomainLedgerRow): string {
	return row.participantId ? `${row.auditorId} · ${row.participantId}` : row.auditorId;
}

function ScoreCell({ score, label }: { readonly score: DomainLedgerAverageScore; readonly label: string }) {
	return (
		<ScoreMicro
			percent={score.percent}
			fraction={score.fraction}
			detail={score.detail}
			label={label}
			className="items-center text-center"
		/>
	);
}

function DomainLedgerTable({ rows, average, metric }: DomainLedgerTableProps) {
	const metricLabel = metric === "raw" ? "Raw" : "Youth-weighted";

	return (
		<div
			role="region"
			aria-label={`${metricLabel} domain comparison. Scroll to review every selected report.`}
			tabIndex={0}
			className="hidden max-h-[32rem] overflow-auto rounded-md border border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none 2xl:block">
			<Table className="min-w-[72rem] table-fixed">
				<TableCaption className="sr-only">
					{metricLabel} score domain comparison. Percentages and fractions use each audit&rsquo;s own maximum.
				</TableCaption>
				<TableHeader className="sticky top-0 z-20 bg-card">
					<TableRow>
						<TableHead scope="col" className="sticky left-0 z-30 w-52 border-r border-border bg-card">
							Audit
						</TableHead>
						<TableHead scope="col" className="w-24 text-center">
							Overall
						</TableHead>
						{domainOrder.map(domain => (
							<TableHead key={domain} scope="col" className="w-32 whitespace-normal">
								<DomainLabel domain={domain} label={domainLabels[domain]} className="text-xs" />
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map(row => (
						<TableRow key={row.auditId}>
							<TableHead
								scope="row"
								className="sticky left-0 z-10 h-auto border-r border-border bg-card py-3 whitespace-normal">
								<span className="block truncate font-medium text-foreground">{auditLabel(row)}</span>
								<span className="mt-1 block text-xs text-muted-foreground">{row.date}</span>
							</TableHead>
							<TableCell>
								<ScoreCell
									score={row.overall}
									label={`${metricLabel} overall score for ${auditLabel(row)}`}
								/>
							</TableCell>
							{row.domains.map(cell => (
								<TableCell key={cell.domain}>
									<ScoreCell
										score={cell}
										label={`${metricLabel} ${domainLabels[cell.domain]} score for ${auditLabel(row)}`}
									/>
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
				<TableFooter className="sticky bottom-0 z-20 bg-muted">
					<TableRow className="bg-muted/95 hover:bg-muted/95">
						<TableHead
							scope="row"
							className="sticky left-0 z-30 h-auto border-r border-border bg-muted py-3 text-foreground">
							Average
							<span className="mt-1 block text-xs font-normal text-muted-foreground">
								{rows.length} selected reports
							</span>
						</TableHead>
						<TableCell>
							<ScoreCell
								score={average.overall}
								label={`${metricLabel} overall average across selected reports`}
							/>
						</TableCell>
						{average.domains.map(cell => (
							<TableCell key={cell.domain}>
								<ScoreCell
									score={cell}
									label={`${metricLabel} ${domainLabels[cell.domain]} average across selected reports`}
								/>
							</TableCell>
						))}
					</TableRow>
				</TableFooter>
			</Table>
		</div>
	);
}

export { DomainLedgerTable };
