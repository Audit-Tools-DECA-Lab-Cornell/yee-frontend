/**
 * Rasterize a standalone SVG string to PNG in the browser: Blob → Image →
 * <canvas> → toDataURL. The browser resolves fonts and any residual colors
 * during raster, so the PNG matches what the user saw (D3). Used both for
 * embedding charts in the PDF (`doc.addImage`) and for the per-chart PNG
 * download. SVG-only environments (SSR / unit tests) never call this.
 */

function parseSvgDimensions(svg: string): { width: number; height: number } {
	const widthMatch = svg.match(/<svg[^>]*\bwidth="([\d.]+)"/);
	const heightMatch = svg.match(/<svg[^>]*\bheight="([\d.]+)"/);
	const width = widthMatch ? Number(widthMatch[1]) : 0;
	const height = heightMatch ? Number(heightMatch[1]) : 0;
	if (width > 0 && height > 0) return { width, height };
	// Fall back to the viewBox if width/height are missing.
	const viewBox = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
	if (viewBox) return { width: Number(viewBox[1]), height: Number(viewBox[2]) };
	return { width: 600, height: 400 };
}

export type RasterResult = {
	dataUrl: string;
	blob: Blob;
	width: number;
	height: number;
};

/**
 * Rasterize an SVG string to a PNG at `scale`× resolution (2× for crisp PDF /
 * slide use). Resolves with the data URL, a Blob, and the rendered pixel size.
 */
export function rasterizeSvg(svg: string, scale = 2): Promise<RasterResult> {
	const { width, height } = parseSvgDimensions(svg);
	const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
	const url = URL.createObjectURL(svgBlob);

	return new Promise<RasterResult>((resolve, reject) => {
		const image = new Image();
		image.decoding = "async";
		image.onload = () => {
			try {
				const canvas = document.createElement("canvas");
				canvas.width = Math.round(width * scale);
				canvas.height = Math.round(height * scale);
				const context = canvas.getContext("2d");
				if (!context) {
					reject(new Error("Could not get a 2D canvas context for chart rasterization"));
					return;
				}
				context.drawImage(image, 0, 0, canvas.width, canvas.height);
				const dataUrl = canvas.toDataURL("image/png");
				canvas.toBlob(
					blob => {
						resolve({
							dataUrl,
							blob: blob ?? new Blob([], { type: "image/png" }),
							width: canvas.width,
							height: canvas.height
						});
					},
					"image/png"
				);
			} catch (error) {
				reject(error instanceof Error ? error : new Error(String(error)));
			} finally {
				URL.revokeObjectURL(url);
			}
		};
		image.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Failed to load SVG for rasterization"));
		};
		image.src = url;
	});
}

/** Convenience: just the PNG data URL (for `doc.addImage`). */
export async function svgToPngDataUrl(svg: string, scale = 2): Promise<string> {
	const result = await rasterizeSvg(svg, scale);
	return result.dataUrl;
}
