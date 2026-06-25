/**
 * Characters that trigger formula evaluation in spreadsheet applications
 * (Excel, Google Sheets, LibreOffice Calc) when they appear at the start of a cell.
 * OWASP CSV Injection: https://owasp.org/www-community/attacks/CSV_Injection
 */
const FORMULA_STARTERS = new Set(["=", "+", "-", "@"]);

/**
 * Sanitizes a CSV cell value to prevent formula injection.
 *
 * If the value, after trimming leading whitespace, starts with a formula-trigger
 * character (`=`, `+`, `-`, `@`, tab, or CR), a leading single-quote is prepended.
 * Spreadsheet applications treat this as a text literal prefix and won't evaluate it
 * as a formula. The original whitespace is preserved after the quote.
 */
export function sanitizeCsvCell(value: string): string {
	const trimmed = value.trimStart();
	if (trimmed.length === 0) return value;
	const first = trimmed[0];
	if (FORMULA_STARTERS.has(first) || first === "\t" || first === "\r") {
		return `'${value}`;
	}
	return value;
}
