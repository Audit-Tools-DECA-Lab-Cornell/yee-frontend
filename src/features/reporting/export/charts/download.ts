/**
 * Per-chart download — pure (no jsPDF/xlsx), so the dashboard can import it
 * statically without pulling the heavy document libraries into its bundle.
 * Ships the builder's standalone SVG directly, or rasterizes it to a 2× PNG.
 */
import { buildExportFileName, triggerBrowserDownload } from "../file-utils";
import { rasterizeSvg } from "./raster";

export async function downloadChart(svg: string, baseName: string, format: "png" | "svg"): Promise<void> {
	const fileName = buildExportFileName(baseName, format);
	if (format === "svg") {
		triggerBrowserDownload(fileName, svg, "image/svg+xml;charset=utf-8;");
		return;
	}
	const { blob } = await rasterizeSvg(svg, 2);
	triggerBrowserDownload(fileName, blob, "image/png");
}
