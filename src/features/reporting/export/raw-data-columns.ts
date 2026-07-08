/**
 * Raw-data export columns — the single definition of the flat raw-data row shape
 * shared by the CSV (byte-compatible with the legacy `toExportRows` +
 * `ExportCsvButton` path) and the Excel workbook. The Data Dictionary metadata
 * lets a researcher hand the Excel file to a statistician without a call
 * (logistics §R5).
 */
import type { RawDataRecord } from "@/features/workspaces/api/live-api";

/**
 * Reproduces `toExportRows` from `live-raw-data-table.tsx` verbatim: the same
 * column names, order, and per-row dynamic `Domain Weight *` / `Response *`
 * columns. `toCsv(rawDataExportRows(rows))` is byte-identical to the legacy CSV.
 */
export function rawDataExportRows(rows: RawDataRecord[]): Record<string, string | number>[] {
	return rows.map(row => {
		const base: Record<string, string | number> = {
			Organization: row.organization,
			"Auditor ID": row.auditor_generated_id,
			Place: row.place_name,
			Project: row.project_name,
			Date: row.date,
			"Submitted At": row.submitted_at,
			"Start Time": row.start_time,
			"Finish Time": row.finish_time,
			"Total Minutes": row.total_minutes,
			"Visit Frequency": row.visit_frequency,
			Season: row.season,
			Weather: row.weather,
			Comments: row.comments,
			"Raw Access": row.raw_access,
			"Raw Activity Spaces": row.raw_activity_spaces,
			"Raw Amenities": row.raw_amenities,
			"Raw Experience of the Space": row.raw_experience_of_space,
			"Raw Aesthetics and Care": row.raw_aesthetics_and_care,
			"Raw Use and Usability": row.raw_use_and_usability,
			"Youth Weighted Access": row.weighted_access,
			"Youth Weighted Activity Spaces": row.weighted_activity_spaces,
			"Youth Weighted Amenities": row.weighted_amenities,
			"Youth Weighted Experience of the Space": row.weighted_experience_of_space,
			"Youth Weighted Aesthetics and Care": row.weighted_aesthetics_and_care,
			"Youth Weighted Use and Usability": row.weighted_use_and_usability,
			"Total Raw Score": row.total_raw_score,
			"Total Youth Weighted Average": row.total_weighted_score
		};
		for (const [key, value] of Object.entries(row.domain_weights)) {
			base[`Domain Weight ${key}`] = value;
		}
		for (const [key, value] of Object.entries(row.responses)) {
			base[`Response ${key}`] = value;
		}
		return base;
	});
}

export type DataDictionaryEntry = {
	column: string;
	meaning: string;
	type: string;
	allowed: string;
};

/** Column metadata for the Excel Data Dictionary sheet. */
export const RAW_DATA_DICTIONARY: DataDictionaryEntry[] = [
	{ column: "Organization", meaning: "Organization the audited place belongs to", type: "text", allowed: "free text" },
	{ column: "Auditor ID", meaning: "Generated auditor code (never a name or email)", type: "text", allowed: "AUD###" },
	{ column: "Place", meaning: "Name of the audited place", type: "text", allowed: "free text" },
	{ column: "Project", meaning: "Project the place belongs to", type: "text", allowed: "free text" },
	{ column: "Date", meaning: "Audit date", type: "date", allowed: "YYYY-MM-DD" },
	{ column: "Submitted At", meaning: "Timestamp the audit was submitted", type: "datetime", allowed: "ISO 8601" },
	{ column: "Start Time", meaning: "Recorded visit start time", type: "text", allowed: "free text / time" },
	{ column: "Finish Time", meaning: "Recorded visit finish time", type: "text", allowed: "free text / time" },
	{ column: "Total Minutes", meaning: "Visit duration in minutes", type: "number", allowed: "≥ 0" },
	{ column: "Visit Frequency", meaning: "How often the auditor visits this place", type: "text", allowed: "free text" },
	{ column: "Season", meaning: "Season during the visit", type: "text", allowed: "free text" },
	{ column: "Weather", meaning: "Weather during the visit", type: "text", allowed: "free text" },
	{ column: "Comments", meaning: "Overall auditor comments", type: "text", allowed: "free text" },
	{ column: "Raw <Domain>", meaning: "Raw score for each of the six domains", type: "number", allowed: "0 – domain max" },
	{ column: "Youth Weighted <Domain>", meaning: "Youth-weighted score for each domain", type: "number", allowed: "0 – domain max" },
	{ column: "Total Raw Score", meaning: "Sum of raw domain scores", type: "number", allowed: "0 – total max" },
	{ column: "Total Youth Weighted Average", meaning: "Youth-weighted average across domains", type: "number", allowed: "0 – total max" },
	{ column: "Domain Weight <domain>", meaning: "Participant importance weight per domain", type: "number", allowed: "1 – 3" },
	{ column: "Response <item id>", meaning: "Recorded answer for each instrument item", type: "text", allowed: "answer label" }
];
