"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toCsv } from "@/lib/dashboard/reporting";

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
		<Button className="rounded-lg bg-[#10231f] text-white hover:bg-[#17302c]" onClick={handleExport}>
			<Download className="size-4" />
			{label}
		</Button>
	);
}
