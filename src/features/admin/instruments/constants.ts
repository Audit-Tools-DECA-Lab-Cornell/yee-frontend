import type { DetailTabKey } from "./types";

/** Default instrument key for the YEE product (backend: `instrument_key="yee"`). */
export const INSTRUMENT_KEY = "yee";

/** React Query key for the admin instrument version list. */
export const INSTRUMENTS_LIST_QUERY_KEY = ["yee", "admin", "instruments", "list"] as const;

/** Tabs shared by the read-only viewer and the draft editor. */
export const DETAIL_TABS: { key: DetailTabKey; label: string }[] = [
	{ key: "preamble", label: "Overview" },
	{ key: "sections", label: "Sections" },
	{ key: "spreadsheet", label: "Spreadsheet" },
	{ key: "preAudit", label: "Pre-Audit Questions" },
	{ key: "scaleGuidance", label: "Scale Guidance" },
	{ key: "legalDocuments", label: "Legal Documents" }
];
