import { ApiError } from "@/lib/api/client";

import type {
	EditableItem,
	EditablePromptEntry,
	InstrumentSummary,
	InstrumentVersionRecord,
	QuestionGroup,
	ScoringCompatibilityReport,
	SpreadsheetGroup,
	StructuredInstrumentContent
} from "./types";

/**
 * YEE instrument text frequently arrives with light HTML markup (from the
 * authoring tool). Normalise it to plain, readable text for read-only display.
 */
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

export function isPlaceholderQuestionText(value: string) {
	const normalized = cleanInstrumentText(value).toLowerCase();
	return normalized === "click to write the question text";
}

export function getDisplayQuestionText(item: EditableItem) {
	const questionText = cleanInstrumentText(item.question_text || "");
	if (!questionText || isPlaceholderQuestionText(questionText)) {
		const choicePrompts = Object.entries(item.choices ?? {})
			.map(([choiceId, choice]) => cleanInstrumentText(choice.Display || choiceId))
			.filter(Boolean);
		if (choicePrompts.length > 0) {
			return choicePrompts.join("\n");
		}
		if (item.answers && Object.keys(item.answers).length > 0) {
			return "Please answer the following questions.";
		}
		return item.item_id;
	}
	return questionText;
}

/**
 * Split a scoring item into the strings an admin may edit, each labelled by what
 * it actually is to an auditor.
 *
 * The split depends on whether the item has an answer scale:
 *
 * - **Matrix** (`answers` non-empty) — `choices` are the matrix rows, i.e. the
 *   questions, and `answers` are the shared options offered for each row.
 * - **Single select** (`answers` empty) — there is no scale, so the auditor
 *   picks one `choices` entry directly and `question_text` carries the question.
 *   Those choices are answer options, not questions; the audit wizard renders
 *   them as the selectable options (`InstrumentQuestionCard`), and
 *   `describeAnswerType` already calls this shape "Single select".
 *
 * Labelling single-select choices as "Question N" would invite an admin to
 * rewrite answer labels as prompts — the mirror image of the matrix bug this
 * helper exists to fix.
 */
export function getEditablePromptEntries(item: EditableItem): EditablePromptEntry[] {
	const questionText = item.question_text ?? "";
	const isMatrix = Object.keys(item.answers ?? {}).length > 0;
	const sharedPrompt: EditablePromptEntry = {
		target: "sharedPrompt",
		entryKey: "question-text",
		label: "Shared prompt",
		value: isPlaceholderQuestionText(questionText) ? "" : questionText
	};
	const choices = Object.entries(item.choices ?? {}).map(
		([optionId, choice], index): EditablePromptEntry => ({
			target: isMatrix ? "question" : "answerOption",
			entryKey: isMatrix ? `question-${optionId}` : `answer-choice-${optionId}`,
			optionId,
			map: "choices",
			label: isMatrix ? `Question ${index + 1}` : `Answer option ${index + 1}`,
			value: choice.Display ?? ""
		})
	);
	const answerOptions = Object.entries(item.answers ?? {}).map(
		([optionId, answer], index): EditablePromptEntry => ({
			target: "answerOption",
			entryKey: `answer-${optionId}`,
			optionId,
			map: "answers",
			label: `Answer option ${index + 1}`,
			value: answer.Display ?? ""
		})
	);

	return [sharedPrompt, ...choices, ...answerOptions];
}

/**
 * Write one edited string back onto its item.
 *
 * Routing is by `entry.map`, never by `entry.target` — a single-select answer
 * option is labelled as an answer but is stored in `choices`. Only the
 * `Display` string changes: map keys and `score_entries` are left untouched, so
 * the version stays scorable.
 */
export function updateEditablePromptEntry(item: EditableItem, entry: EditablePromptEntry, value: string): EditableItem {
	if (entry.target === "sharedPrompt") return { ...item, question_text: value };

	if (entry.map === "choices") {
		const choices = { ...(item.choices ?? {}) };
		choices[entry.optionId] = { ...(choices[entry.optionId] ?? {}), Display: value };
		return { ...item, choices };
	}

	const answers = { ...(item.answers ?? {}) };
	answers[entry.optionId] = { ...(answers[entry.optionId] ?? {}), Display: value };
	return { ...item, answers };
}

export function isThrowawayVersion(version: InstrumentVersionRecord) {
	return version.instrument_version.toLowerCase().includes("smoke-test");
}

export function summarizeInstrument(content: Record<string, unknown> | null): InstrumentSummary {
	if (!content) {
		return {
			name: "Unavailable",
			key: "yee",
			version: "Unknown",
			sections: 0,
			items: 0,
			preAuditQuestions: 0,
			legalDocuments: 0
		};
	}

	return {
		name:
			typeof content.survey_name === "string"
				? content.survey_name
				: typeof content.instrument_name === "string"
					? content.instrument_name
					: "YEE Instrument",
		key: typeof content.instrument_key === "string" ? content.instrument_key : "yee",
		version:
			typeof content.version === "string"
				? content.version
				: typeof content.instrument_version === "string"
					? content.instrument_version
					: "Unknown",
		sections: Array.isArray(content.sections) ? content.sections.length : 0,
		items: Array.isArray(content.scoring_items) ? content.scoring_items.length : 0,
		preAuditQuestions: Array.isArray(content.pre_audit_questions) ? content.pre_audit_questions.length : 0,
		legalDocuments: Array.isArray(content.legal_documents) ? content.legal_documents.length : 0
	};
}

export function getTypedContent(content: Record<string, unknown> | null): StructuredInstrumentContent | null {
	if (!content) return null;
	return content as StructuredInstrumentContent;
}

export function getQuestionGroups(content: StructuredInstrumentContent | null): QuestionGroup[] {
	const groups = new Map<string, { section: QuestionGroup["section"]; items: EditableItem[] }>();
	const sections = content?.sections ?? [];
	const items = content?.scoring_items ?? [];

	for (const section of sections) {
		groups.set(section.block, { section, items: [] });
	}

	for (const item of items) {
		const key = item.block ?? item.block_title ?? "other";
		const existing = groups.get(key) ?? { section: null, items: [] };
		existing.items.push(item);
		groups.set(key, existing);
	}

	return Array.from(groups.entries()).map(([blockKey, value]) => ({
		blockKey,
		section: value.section,
		items: value.items
	}));
}

/** "Feb 26, 2026" — humanize an ISO timestamp for version metadata. */
export function formatCreatedAt(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

/** Human answer-type label for a scoring item, without leaking the derivation. */
export function describeAnswerType(item: EditableItem): "Matrix" | "Single select" {
	return item.answers && Object.keys(item.answers).length > 0 ? "Matrix" : "Single select";
}

/** Grouped spreadsheet rows: each section with its items nested, replacing the flat dash-laden rows. */
export function buildSpreadsheetGroups(content: StructuredInstrumentContent | null): SpreadsheetGroup[] {
	return getQuestionGroups(content).map(group => {
		const sectionTitle = cleanInstrumentText(group.section?.title || group.items[0]?.block_title || group.blockKey);
		const description = cleanInstrumentText(group.section?.intro_text) || undefined;
		const notesPrompt = cleanInstrumentText(group.section?.comment_prompt) || undefined;
		return {
			blockKey: group.blockKey,
			sectionTitle,
			description,
			notesPrompt,
			items: group.items.map(item => ({
				id: item.item_id,
				prompt: getDisplayQuestionText(item)
			}))
		};
	});
}

/** Append `-draft` to a version label unless it already ends with it. */
export function toDraftLabel(versionLabel: string) {
	return versionLabel.endsWith("-draft") ? versionLabel : `${versionLabel}-draft`;
}

/**
 * A `-draft` label that no existing version already uses: `1-draft`, then
 * `1-draft-2`, `1-draft-3`, … Saving twice used to mint two rows sharing one
 * label, leaving the history list ambiguous. Existing duplicates are left
 * alone — this only prevents new ones.
 */
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

function readScoringCompatibility(payload: unknown): ScoringCompatibilityReport | null {
	if (!payload || typeof payload !== "object") return null;
	const detail = (payload as Record<string, unknown>).detail;
	if (!detail || typeof detail !== "object") return null;
	const report = (detail as Record<string, unknown>).scoring_compatibility;
	if (!report || typeof report !== "object") return null;
	const candidate = report as Partial<ScoringCompatibilityReport>;
	if (typeof candidate.ok !== "boolean") return null;
	return {
		ok: candidate.ok,
		scoring_version: typeof candidate.scoring_version === "string" ? candidate.scoring_version : "",
		required_item_count: typeof candidate.required_item_count === "number" ? candidate.required_item_count : 0,
		present_item_count: typeof candidate.present_item_count === "number" ? candidate.present_item_count : 0,
		missing_items: Array.isArray(candidate.missing_items) ? candidate.missing_items.map(String) : [],
		missing_choices: Array.isArray(candidate.missing_choices) ? candidate.missing_choices.map(String) : []
	};
}

/** At most this many IDs are named before the message switches to a count. */
const MAX_NAMED_MISSING_ITEMS = 8;

function listMissing(ids: string[]): string {
	if (ids.length <= MAX_NAMED_MISSING_ITEMS) return ids.join(", ");
	return `${ids.slice(0, MAX_NAMED_MISSING_ITEMS).join(", ")} and ${ids.length - MAX_NAMED_MISSING_ITEMS} more`;
}

/**
 * Turn a failed instrument save into something an admin can act on.
 *
 * The publish path 409s with `detail.scoring_compatibility` naming exactly which
 * scored questions went missing. Surfacing those IDs is the difference between
 * "it didn't work" and "restore QID1#1 and QID11#2".
 */
export function describeInstrumentSaveError(error: unknown): { title: string; description: string } {
	const report = error instanceof ApiError ? readScoringCompatibility(error.payload) : null;
	if (report && report.missing_items.length > 0) {
		return {
			title: "Publishing blocked — scored questions are missing",
			description: `This version has ${report.present_item_count} of the ${report.required_item_count} questions the scoring engine needs. Restore ${listMissing(report.missing_items)}, then save again.`
		};
	}
	if (report && !report.ok) {
		return {
			title: "Publishing blocked — this version cannot be scored",
			description: `This version has ${report.present_item_count} of the ${report.required_item_count} questions the scoring engine needs.`
		};
	}
	const message = error instanceof Error ? error.message : "Could not save the instrument version.";
	if (report && report.missing_choices.length > 0) {
		return {
			title: "Could not save version",
			description: `${message} Answer rows also look changed: ${listMissing(report.missing_choices)}.`
		};
	}
	return { title: "Could not save version", description: message };
}

/** Fetch the canonical (currently published) YEE instrument via the proxy. */
export async function fetchCanonicalInstrument(): Promise<Record<string, unknown>> {
	const response = await fetch("/api/yee/instrument", { cache: "no-store" });
	const text = await response.text();
	const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
	if (!response.ok) {
		const detail =
			typeof data.detail === "string"
				? data.detail
				: typeof data.error === "string"
					? data.error
					: "Could not load the current YEE instrument.";
		throw new Error(detail);
	}
	return data;
}
