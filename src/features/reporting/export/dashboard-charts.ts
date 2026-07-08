/**
 * Lightweight, jsPDF-free surface for the on-screen reports dashboard. The
 * dashboard imports these statically (the pieces are pure: chart geometry, SVG
 * builders, palette resolution, per-chart download, comparison math). The heavy
 * document generators stay behind the dynamic `index.ts` import so jsPDF/xlsx
 * never enter the dashboard bundle (D2). Keep this barrel free of any pdf/excel
 * import.
 */
export { getExportPalette } from "./export-palette";
export { buildRadarSvg, type RadarSeries } from "./charts/radar";
export { buildTrendSvg, type TrendPoint } from "./charts/trend";
export { downloadChart } from "./charts/download";
export { auditRawPercent, auditWeightedPercent, buildPlaceComparisonSummaries, percentage } from "./comparison-metrics";
export type { ExportPalette, PlaceComparisonSummary, ReportDocumentFormat, ReportScope } from "./types";
