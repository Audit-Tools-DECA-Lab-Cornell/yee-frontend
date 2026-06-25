import { sanitizeCsvCell } from "./sanitize-cell";

/**
 * Converts an array of flat records to a RFC 4180-compliant CSV string.
 *
 * Cell values are:
 * 1. Converted to strings.
 * 2. Sanitized to prevent formula injection (see sanitizeCsvCell).
 * 3. Wrapped in double-quotes with internal double-quotes doubled ("").
 *
 * Returns an empty string for an empty array.
 */
export function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);

  const escapeCell = (value: string | number): string => {
    const sanitized = sanitizeCsvCell(String(value));
    return `"${sanitized.replaceAll('"', '""')}"`;
  };

  return [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCell(row[header] ?? "")).join(",")
    ),
  ].join("\n");
}
