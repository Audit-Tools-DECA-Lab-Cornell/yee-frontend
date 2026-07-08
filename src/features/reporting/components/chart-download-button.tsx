"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { downloadChart } from "@/features/reporting/export/dashboard-charts";

/**
 * Small per-chart download control (PNG 2× / SVG). Lives in the corner of each
 * chart card. `buildSvg` is called lazily on click so the standalone SVG is
 * generated from the current data at export time (implementation-plan logistics
 * §4, plan M3). Pure export path — no jsPDF pulled into the dashboard bundle.
 */
export function ChartDownloadButton({
	buildSvg,
	baseName,
	label = "Download chart"
}: {
	buildSvg: () => string;
	baseName: string;
	label?: string;
}) {
	const [pending, setPending] = React.useState(false);

	async function handle(format: "png" | "svg") {
		setPending(true);
		try {
			await downloadChart(buildSvg(), baseName, format);
		} catch (error) {
			toast.error("Chart download failed", {
				description: error instanceof Error ? error.message : "Could not generate the image."
			});
		} finally {
			setPending(false);
		}
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button type="button" variant="quiet" size="icon-sm" aria-label={label} disabled={pending}>
					<Download className="size-4" aria-hidden />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onSelect={() => void handle("png")}>PNG (2× resolution)</DropdownMenuItem>
				<DropdownMenuItem onSelect={() => void handle("svg")}>SVG (vector)</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
