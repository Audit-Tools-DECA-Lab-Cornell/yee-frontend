export interface InstrumentItem {
	item_id: string;
	base_question_id: string;
	block: string;
	block_title?: string;
	question_text: string;
	item_kind?: "presence" | "condition";
	choices: Record<string, { Display?: string }>;
	answers: Record<string, { Display?: string }>;
}

export interface InstrumentSectionMeta {
	block: string;
	title: string;
	intro_text: string;
	comment_prompt: string;
}

export interface InstrumentResponse {
	survey_name: string;
	version: string;
	sections?: InstrumentSectionMeta[];
	scoring_items: InstrumentItem[];
}

export async function fetchInstrument(): Promise<InstrumentResponse> {
	const response = await fetch("/api/yee/instrument", { cache: "no-store" });
	if (!response.ok) {
		const body = await response.json().catch(() => null);
		const message =
			body && typeof body === "object" && "error" in body
				? `${String(body.error)} (${response.status})`
				: `Failed to load instrument (${response.status})`;
		throw new Error(message);
	}
	return response.json() as Promise<InstrumentResponse>;
}

export function getBlockMatch(domainLabel: string) {
	switch (domainLabel) {
		case "Activity Spaces":
			return "Activity Spaces";
		case "Experience of the Space":
			return "Experience of Space";
		default:
			return domainLabel;
	}
}

export function filterItemsForDomain(items: InstrumentItem[], domainLabel: string) {
	const match = getBlockMatch(domainLabel).toLowerCase();
	return items.filter(item => item.block.toLowerCase().includes(match));
}

export function findSectionMeta(instrument: InstrumentResponse, domainLabel: string) {
	const match = getBlockMatch(domainLabel).toLowerCase();
	return instrument.sections?.find(section => section.block.toLowerCase().includes(match)) ?? null;
}
