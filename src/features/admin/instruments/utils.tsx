export function cleanInstrumentText(value: string | null | undefined) {
	return (value ?? "")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/p>/gi, "\n\n")
		.replace(/<[^>]+>/g, " ")
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/\s+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.replace(/[ \t]{2,}/g, " ")
		.trim();
}

export function formatCreatedAt(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

export function toDraftLabel(versionLabel: string) {
	return versionLabel.endsWith("-draft") ? versionLabel : `${versionLabel}-draft`;
}

export function toUniqueDraftLabel(versionLabel: string, existingLabels: Iterable<string>): string {
	const taken = new Set(Array.from(existingLabels, label => label.trim().toLowerCase()));
	const base = toDraftLabel(versionLabel);
	if (!taken.has(base.toLowerCase())) return base;
	for (let suffix = 2; suffix < 1000; suffix += 1) {
		const candidate = `${base}-${suffix}`;
		if (!taken.has(candidate.toLowerCase())) return candidate;
	}
	return base;
}
