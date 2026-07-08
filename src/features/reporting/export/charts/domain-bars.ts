/**
 * Per-domain horizontal bars — standalone SVG. For R1: each domain shows a Raw
 * bar and a Youth-Weighted bar, tinted with that domain's color (fill = raw,
 * strong = weighted), with the percentage at the end of each bar.
 */
import type { ExportPalette, YeeDomainKey } from "../types";
import { clampPercent } from "./geometry";
import { svgDocument, svgRect, svgText } from "./svg-primitives";

export type DomainBarRow = {
	domainKey: YeeDomainKey;
	label: string;
	rawPercent: number;
	weightedPercent: number;
};

export function buildDomainBarsSvg(options: {
	rows: DomainBarRow[];
	palette: ExportPalette;
	width?: number;
	title?: string;
}): string {
	const { rows, palette, width = 720, title } = options;
	const labelWidth = 150;
	const rowGap = 18;
	const barHeight = 18;
	const barGap = 9;
	const groupHeight = barHeight * 2 + barGap + rowGap;
	const top = 16;
	const trackLeft = labelWidth + 12;
	const trackWidth = width - trackLeft - 56; // room for % label at the end
	const height = top + rows.length * groupHeight + 8;
	const parts: string[] = [];

	rows.forEach((row, index) => {
		const groupTop = top + index * groupHeight;
		const colors = palette.domains[row.domainKey];

		// Domain label (left column), vertically centered on the pair.
		parts.push(
			svgText({
				x: labelWidth,
				y: groupTop + barHeight + barGap / 2 + 4,
				text: row.label,
				fill: colors.text,
				size: 11.5,
				weight: 600,
				anchor: "end"
			})
		);

		const bars: { y: number; percent: number; color: string; tag: string }[] = [
			{ y: groupTop, percent: clampPercent(row.rawPercent), color: colors.fill, tag: "Raw" },
			{
				y: groupTop + barHeight + barGap,
				percent: clampPercent(row.weightedPercent),
				color: colors.strong,
				tag: "YW"
			}
		];

		for (const bar of bars) {
			// Track.
			parts.push(
				svgRect(trackLeft, bar.y, trackWidth, barHeight, palette.brand.border, { rx: 3, opacity: 0.35 })
			);
			// Fill.
			const fillWidth = Math.max((trackWidth * bar.percent) / 100, bar.percent > 0 ? 2 : 0);
			parts.push(svgRect(trackLeft, bar.y, fillWidth, barHeight, bar.color, { rx: 3 }));
			// Value + tag.
			parts.push(
				svgText({
					x: trackLeft + trackWidth + 8,
					y: bar.y + barHeight - 2.5,
					text: `${bar.percent.toFixed(0)}%`,
					fill: palette.brand.foreground,
					size: 10.5,
					weight: 600
				})
			);
			parts.push(
				svgText({
					x: trackLeft + 4,
					y: bar.y + barHeight - 3,
					text: bar.tag,
					fill: "#ffffff",
					size: 8,
					weight: 700
				})
			);
		}
	});

	return svgDocument({
		width,
		height,
		background: palette.brand.surface,
		title: title ?? "Per-domain scores",
		body: parts.join("")
	});
}
