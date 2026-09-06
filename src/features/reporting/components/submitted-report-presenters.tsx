import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { ScoreStack } from "@/components/ui/score-stack";
import type { PlaceComparisonAuditRecord } from "@/features/workspaces/api/live-api";

type ReportSelectionControls = {
	selectedIds: ReadonlySet<string>;
	selectionFull: boolean;
	onToggle: (auditId: string) => void;
};

function SubmittedScore({ value, maximum, digits = 0 }: { value: number; maximum: number; digits?: number }) {
	return <ScoreStack value={value} max={maximum} fractionDigits={digits} size="sm" />;
}

function ReportCheckbox({
	record,
	checked,
	disabled,
	onToggle
}: {
	record: PlaceComparisonAuditRecord;
	checked: boolean;
	disabled: boolean;
	onToggle: (auditId: string) => void;
}) {
	return (
		<label className="inline-flex size-11 cursor-pointer items-center justify-center rounded-control focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
			<span className="sr-only">
				Select report by {record.auditor_id}, submitted {record.date}
				{record.participant_id ? `, participant ${record.participant_id}` : ""}
			</span>
			<input
				type="checkbox"
				name={`compare-${record.audit_id}`}
				checked={checked}
				disabled={disabled}
				onChange={() => onToggle(record.audit_id)}
				className="size-4 accent-primary"
			/>
		</label>
	);
}

function SubmittedReportMobileCard({
	record,
	selectedIds,
	selectionFull,
	onToggle
}: { record: PlaceComparisonAuditRecord } & ReportSelectionControls) {
	const selected = selectedIds.has(record.audit_id);

	return (
		<article className="rounded-md border border-border bg-card p-4">
			<div className="flex items-start gap-3">
				<ReportCheckbox
					record={record}
					checked={selected}
					disabled={selectionFull && !selected}
					onToggle={onToggle}
				/>
				<div className="min-w-0 flex-1 space-y-1.5">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<p className="font-medium text-foreground">{record.auditor_id}</p>
						<span className="text-xs text-muted-foreground">{record.date}</span>
					</div>
					{record.participant_id ? (
						<p className="text-sm text-muted-foreground">Participant {record.participant_id}</p>
					) : null}
					<div className="grid gap-2 pt-1 text-sm sm:grid-cols-2">
						<SubmittedScore value={record.total_raw_score} maximum={record.total_raw_maximum} />
						<SubmittedScore
							value={record.total_weighted_score}
							maximum={record.total_weighted_maximum}
							digits={2}
						/>
					</div>
					<Link
						href={`/yee/submissions/${record.audit_id}`}
						className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline">
						Open report
					</Link>
				</div>
			</div>
		</article>
	);
}

function createSubmittedReportColumns({
	selectedIds,
	selectionFull,
	onToggle
}: ReportSelectionControls): ColumnDef<PlaceComparisonAuditRecord>[] {
	return [
		{
			id: "select",
			header: () => <span className="sr-only">Select</span>,
			enableSorting: false,
			cell: ({ row }) => {
				const selected = selectedIds.has(row.original.audit_id);
				return (
					<ReportCheckbox
						record={row.original}
						checked={selected}
						disabled={selectionFull && !selected}
						onToggle={onToggle}
					/>
				);
			}
		},
		{
			accessorKey: "auditor_id",
			header: "Auditor ID",
			cell: ({ getValue }) => <span className="font-medium text-foreground">{String(getValue())}</span>
		},
		{
			accessorKey: "participant_id",
			header: "Participant ID",
			cell: ({ getValue }) => {
				const value = getValue();
				return <span className="text-muted-foreground">{value ? String(value) : "—"}</span>;
			}
		},
		{
			accessorKey: "date",
			header: "Submitted",
			cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
		},
		{
			id: "raw",
			header: "Total Raw Score",
			cell: ({ row }) => (
				<SubmittedScore value={row.original.total_raw_score} maximum={row.original.total_raw_maximum} />
			)
		},
		{
			id: "weighted",
			header: "Total Youth Weighted",
			cell: ({ row }) => (
				<SubmittedScore
					value={row.original.total_weighted_score}
					maximum={row.original.total_weighted_maximum}
					digits={2}
				/>
			)
		},
		{
			id: "report",
			header: () => <span className="sr-only">Report</span>,
			enableSorting: false,
			cell: ({ row }) => (
				<Link
					href={`/yee/submissions/${row.original.audit_id}`}
					className="text-sm font-medium text-primary underline-offset-4 hover:underline">
					Open report
				</Link>
			)
		}
	];
}

export { createSubmittedReportColumns, SubmittedReportMobileCard };
