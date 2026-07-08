/**
 * Shared types for the YEE export layer.
 *
 * Per the module rule (implementation-plan D5): this file imports from **no
 * sibling** inside `export/` so it can never take part in an import cycle. It
 * may reference the app's canonical domain config (the single source of truth
 * for domain keys/labels/order), which lives outside this module.
 */
import { domainLabels, domainOrder } from "@/features/reporting/reporting";
import type { YeeDomainKey } from "@/features/yee-audit/config/yee-audit-config";
import type { InstrumentResponse } from "@/features/yee-audit/api/yee-instrument";
import type { YeeSubmissionRecord } from "@/features/yee-audit/api/yee-audit-api";
import type { PlaceComparisonAuditRecord, RawDataRecord } from "@/features/workspaces/api/live-api";

export { domainLabels, domainOrder };
export type { YeeDomainKey };

/** Every file format the export layer can emit. */
export type ExportFormat = "pdf" | "xlsx" | "csv" | "png" | "svg" | "zip";

/** Formats offered by the R1/R2/R3/R4 designed-report menus. */
export type ReportDocumentFormat = Extract<ExportFormat, "pdf" | "xlsx" | "csv">;

export type ScoreBandKey = "low" | "mid" | "high";

/**
 * When a payload lacks a generated auditor ID, exports must show this
 * placeholder — never the raw auditor identifier (logistics §3 privacy
 * invariant; plan acceptance criterion 5).
 */
export const REDACTED_AUDITOR_ID = "Auditor ID unavailable";

/** One domain's four resolved hex colors (from the `--domain-*` tokens). */
export type DomainColorSet = {
	text: string;
	strong: string;
	fill: string;
	light: string;
};

export type ScoreBandColorSet = {
	/** Foreground / solid fill (`--score-*`). */
	fg: string;
	/** Tinted background (`--score-*-bg`). */
	bg: string;
};

/**
 * The resolved-hex palette every downstream builder consumes (SVG builders,
 * autotable fills, XLSX cell styles). Produced by `getExportPalette()`; the
 * literal-hex fallback table mirrors `globals.css` for non-DOM contexts.
 */
export type ExportPalette = {
	domains: Record<YeeDomainKey, DomainColorSet>;
	/** Categorical series colors (`--chart-series-1..5`), index 0 = series 1. */
	chartSeries: string[];
	bands: Record<ScoreBandKey, ScoreBandColorSet>;
	/** Chart grid rule color (`--chart-grid`). */
	grid: string;
	/** Chart axis / label text color (`--chart-axis`). */
	axis: string;
	brand: {
		green950: string;
		green900: string;
		green700: string;
		green50: string;
		/** `--foreground` — body text. */
		foreground: string;
		/** `--muted-foreground` — secondary text. */
		muted: string;
		/** `--border`. */
		border: string;
		/** Page/card surface (`--card`). */
		surface: string;
	};
};

/**
 * Human-readable filter scope printed on comparison-report covers so the
 * document is self-describing (logistics §2). `line` mirrors the on-screen
 * "Current scope" sentence.
 */
export type ReportScope = {
	line: string;
	auditCount: number;
	placeCount: number;
};

/** R1 — one submitted audit + the instrument it was scored against. */
export type AuditReportInput = {
	submission: YeeSubmissionRecord;
	instrument: InstrumentResponse | null;
};

/** Per-place rollup consumed by R2 (mirrors the dashboard's PlaceSummary). */
export type PlaceComparisonSummary = {
	placeId: string;
	placeName: string;
	projectName: string;
	auditCount: number;
	avgRawScore: number;
	avgWeightedScore: number;
	avgRawPercent: number;
	avgWeightedPercent: number;
	rawPercentByDomain: Record<YeeDomainKey, number>;
	weightedPercentByDomain: Record<YeeDomainKey, number>;
};

/** R2 — Compare Places. */
export type PlaceComparisonReportInput = {
	summaries: PlaceComparisonSummary[];
	audits: PlaceComparisonAuditRecord[];
	scope: ReportScope;
};

/** R3 — Compare Over Time (one place). */
export type TrendReportInput = {
	placeName: string;
	projectName: string;
	records: PlaceComparisonAuditRecord[];
	scope: ReportScope;
};

/** R4 — Compare Individual Audits (2–3 selected). */
export type AuditComparisonReportInput = {
	records: PlaceComparisonAuditRecord[];
	scope: ReportScope;
};

/** R5 — the flat raw-data surface (CSV/Excel). */
export type RawDataReportInput = {
	rows: RawDataRecord[];
};
