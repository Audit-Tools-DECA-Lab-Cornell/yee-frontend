/**
 * Browser download + file-naming helpers.
 *
 * Naming convention (logistics §5): `yee-<report>-<scope-slug>-<yyyy-mm-dd>.<ext>`
 * e.g. `yee-audit-riverside-park-2026-06-12.pdf`,
 * `yee-place-comparison-2026-07-07.xlsx`, `yee-audits-2026-07-07.zip`.
 */

/** Trigger a browser download for a Blob or string payload. */
export function triggerBrowserDownload(filename: string, data: Blob | string, mimeType?: string): void {
	const blob = typeof data === "string" ? new Blob([data], { type: mimeType ?? "text/plain;charset=utf-8;" }) : data;
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.rel = "noopener";
	anchor.click();
	// Revoke on the next tick so Safari has time to start the download.
	setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Lowercase, hyphenated, ASCII-safe slug for a scope fragment (place/project). */
export function slugify(value: string): string {
	return (
		value
			.normalize("NFKD")
			.replace(/[̀-ͯ]/g, "") // strip combining diacritics
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.slice(0, 60)
			.replace(/^-+|-+$/g, "") || "export"
	);
}

/** Today (or a supplied date) as `yyyy-mm-dd` in local time. */
export function isoDateStamp(date: Date = new Date()): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * Build a download filename. `scopeSlug` is optional — comparison exports that
 * describe many places omit it (`yee-place-comparison-2026-07-07.xlsx`).
 */
export function buildExportFileName(
	report: string,
	extension: string,
	options: { scopeSlug?: string; date?: Date } = {}
): string {
	const parts = ["yee", report];
	if (options.scopeSlug) parts.push(slugify(options.scopeSlug));
	parts.push(isoDateStamp(options.date));
	return `${parts.join("-")}.${extension}`;
}
