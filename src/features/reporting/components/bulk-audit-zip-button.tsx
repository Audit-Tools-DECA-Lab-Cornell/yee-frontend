"use client";

import * as React from "react";
import { FileArchive } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { BatchProgress } from "@/features/reporting/export";

/**
 * "Download audit PDFs (ZIP)" control (logistics §R5, plan M4/D6). Guards the
 * heavy tail with the size estimator (confirm above the threshold), reports
 * k-of-N progress on the button, and surfaces partial failures ("N audits could
 * not be exported") instead of aborting the archive. Everything is dynamically
 * imported so jsPDF/xlsx load only when a bulk export actually runs.
 */
export function BulkAuditZipButton({
	auditIds,
	label = "Download audit PDFs (ZIP)",
	variant = "outline",
	size = "default",
	className,
	disabled = false
}: {
	auditIds: string[];
	label?: string;
	variant?: React.ComponentProps<typeof Button>["variant"];
	size?: React.ComponentProps<typeof Button>["size"];
	className?: string;
	disabled?: boolean;
}) {
	const [progress, setProgress] = React.useState<BatchProgress | null>(null);
	const [confirmState, setConfirmState] = React.useState<{ open: boolean; includeExcel: boolean; reasons: string[] }>({
		open: false,
		includeExcel: false,
		reasons: []
	});

	const busy = progress !== null;

	async function runExport(includeExcel: boolean) {
		setProgress({ completed: 0, total: auditIds.length, failed: 0 });
		try {
			const [{ exportAuditBatchZip }, { fetchSubmission }, { fetchInstrument }] = await Promise.all([
				import("@/features/reporting/export"),
				import("@/features/yee-audit/api/yee-audit-api"),
				import("@/features/yee-audit/api/yee-instrument")
			]);
			const instrument = await fetchInstrument().catch(() => null);
			const result = await exportAuditBatchZip({
				auditIds,
				fetchSubmission,
				instrument,
				includeExcel,
				onProgress: setProgress
			});
			if (result.failures.length > 0) {
				toast.warning(`${result.failures.length} of ${auditIds.length} audits could not be exported`, {
					description: "The rest were included in the ZIP."
				});
			} else {
				toast.success(`Exported ${auditIds.length} ${auditIds.length === 1 ? "audit" : "audits"} to a ZIP`);
			}
		} catch (error) {
			toast.error("Bulk export failed", {
				description: error instanceof Error ? error.message : "Could not generate the ZIP."
			});
		} finally {
			setProgress(null);
		}
	}

	async function handleSelect(includeExcel: boolean) {
		const { estimateBulkExport } = await import("@/features/reporting/export");
		const estimate = estimateBulkExport(auditIds.length, includeExcel ? 2 : 1);
		if (estimate.shouldWarn) {
			setConfirmState({ open: true, includeExcel, reasons: estimate.reasons });
			return;
		}
		void runExport(includeExcel);
	}

	const triggerLabel = busy && progress ? `Exporting ${progress.completed}/${progress.total}…` : label;
	const noAudits = auditIds.length === 0;

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						variant={variant}
						size={size}
						className={className}
						isLoading={busy}
						disabled={disabled || busy || noAudits}>
						{!busy ? <FileArchive className="size-4" aria-hidden /> : null}
						{triggerLabel}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="min-w-56">
					<DropdownMenuItem onSelect={() => void handleSelect(false)}>PDF report per audit</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => void handleSelect(true)}>PDF + Excel per audit</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<ConfirmDialog
				open={confirmState.open}
				onOpenChange={open => setConfirmState(current => ({ ...current, open }))}
				title="Large export"
				description={`This may be slow to generate in the browser: ${confirmState.reasons.join("; ")}. Export anyway?`}
				confirmLabel="Export anyway"
				onConfirm={() => runExport(confirmState.includeExcel)}
			/>
		</>
	);
}
