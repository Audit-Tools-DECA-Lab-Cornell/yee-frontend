"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toCsv } from "@/features/reporting/reporting";

export function ExportCsvButton({
	filename,
	rows,
	label = "Download CSV"
}: {
	filename: string;
	rows: Record<string, string | number>[];
	label?: string;
}) {
	function handleExport() {
		const csv = toCsv(rows);
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = filename;
		anchor.click();
		URL.revokeObjectURL(url);
	}

	return (
		<Button variant="outline" onClick={handleExport}>
			<Download className="size-4" />
			{label}
		</Button>
	);
}
