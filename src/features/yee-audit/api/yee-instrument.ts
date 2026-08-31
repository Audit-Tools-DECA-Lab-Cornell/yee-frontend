import type { AuthoringInstrument } from "@/features/admin/instruments/authoring/schema";

export interface InstrumentScoreEntry {
	item_id: string;
	choice_id: string;
	answer_id: string;
	scores_by_category_id: Record<string, number>;
}

export interface InstrumentItem {
	item_id: string;
	base_question_id: string;
	block: string;
	block_title?: string;
	question_text: string;
	item_kind?: "presence" | "condition";
	choices: Record<string, { Display?: string }>;
	answers: Record<string, { Display?: string }>;
	score_entries?: InstrumentScoreEntry[];
}

export interface InstrumentSectionMeta {
	block: string;
	title: string;
	intro_text: string;
	comment_prompt: string;
}

/** One selectable importance level on the youth-weighting step. */
export interface InstrumentWeightingOption {
	value: string;
	label: string;
	notes?: string | null;
}

/** One domain row on the youth-weighting step. `key` matches `YeeDomainKey`. */
export interface InstrumentWeightingDomain {
	key: string;
	label: string;
	prompt: string;
}

/** Youth-weighting step content: intro copy, the scale, and per-domain prompts. */
export interface InstrumentWeighting {
	title?: string;
	description?: string;
	options?: InstrumentWeightingOption[];
	domains?: InstrumentWeightingDomain[];
}

export interface InstrumentResponse {
	survey_name: string;
	version: string;
	instrument_key?: string;
	instrument_version?: string;
	sections?: InstrumentSectionMeta[];
	scoring_items: InstrumentItem[];
	/** Weighting step copy. Absent on older instrument versions. */
	weighting?: InstrumentWeighting | null;
	/** Shared "If yes, please rate the condition…" follow-up prompt. */
	condition_prompt?: string;
	/** Prompt for the overall/final comments field before review & submit. */
	final_comments_prompt?: string;
	authoring?: AuthoringInstrument | null;
}

export type InstrumentStamp = {
	instrumentKey: string;
	instrumentVersion: string;
};

export async function fetchInstrument(stamp?: InstrumentStamp | null): Promise<InstrumentResponse> {
	const query = stamp
		? `?instrument_key=${encodeURIComponent(stamp.instrumentKey)}&instrument_version=${encodeURIComponent(stamp.instrumentVersion)}`
		: "";
	const response = await fetch(`/api/yee/instrument${query}`, { cache: "no-store" });
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

/* ------------------------------------------------------------------ *
 * Instrument-supplied audit copy
 *
 * The weighting step, the condition follow-up and the final comments
 * prompt are all authored in the instrument and editable from the admin
 * Audit Copy tab. yee-mobile already reads them (see
 * `yee-mobile/lib/yee-mobile-instrument.ts`); these helpers give the web
 * wizard the same behaviour so an admin's published wording reaches both
 * clients instead of only one.
 *
 * Fallbacks keep older instrument versions rendering exactly as before.
 * ------------------------------------------------------------------ */

/** Non-blank instrument string, or the built-in fallback. */
function preferInstrumentText(value: string | null | undefined, fallback: string): string {
	const trimmed = (value ?? "").trim();
	return trimmed.length > 0 ? trimmed : fallback;
}

export function resolveWeightingTitle(instrument: InstrumentResponse | null, fallback: string): string {
	return preferInstrumentText(instrument?.weighting?.title, fallback);
}

export function resolveWeightingDescription(instrument: InstrumentResponse | null, fallback: string): string {
	return preferInstrumentText(instrument?.weighting?.description, fallback);
}

export function resolveWeightingDomainPrompt(
	instrument: InstrumentResponse | null,
	domainKey: string,
	fallback: string
): string {
	const domain = (instrument?.weighting?.domains ?? []).find(candidate => candidate?.key === domainKey);
	return preferInstrumentText(domain?.prompt, fallback);
}

/**
 * Weighting scale labels from the instrument, keyed onto the local options.
 *
 * The `value`s ("3" / "2" / "1") are the scoring contract — the draft stores
 * them and the backend scores on them — so the local list owns the values and
 * their order. Only the labels are taken from the instrument, matched by value.
 * An instrument option with an unrecognised value is ignored rather than
 * silently introducing an unscoreable choice.
 */
export function resolveWeightingOptions<T extends { value: string; label: string }>(
	instrument: InstrumentResponse | null,
	fallbackOptions: readonly T[]
): T[] {
	const byValue = new Map(
		(instrument?.weighting?.options ?? [])
			.filter(option => option && typeof option.value === "string")
			.map(option => [option.value, option.label] as const)
	);
	return fallbackOptions.map(option => ({
		...option,
		label: preferInstrumentText(byValue.get(option.value), option.label)
	}));
}

export function resolveConditionPrompt(instrument: InstrumentResponse | null, fallback: string): string {
	return preferInstrumentText(instrument?.condition_prompt, fallback);
}

export function resolveFinalCommentsPrompt(instrument: InstrumentResponse | null, fallback: string): string {
	return preferInstrumentText(instrument?.final_comments_prompt, fallback);
}
