import type {
	EditableItem,
	InstrumentSummary,
	InstrumentVersionRecord,
	QuestionGroup,
	SpreadsheetRow,
	StructuredInstrumentContent
} from "./types";

/**
 * YEE instrument text frequently arrives with light HTML markup (from the
 * authoring tool). Normalise it to plain, readable text for display/editing.
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

export function getEditablePromptEntries(item: EditableItem) {
	const questionText = cleanInstrumentText(item.question_text || "");
	const choiceEntries = Object.entries(item.choices ?? {})
		.map(([choiceId, choice]) => ({
			entryKey: `choice-${choiceId}`,
			choiceId,
			label: `${item.item_id} · Prompt ${choiceId}`,
			value: cleanInstrumentText(choice.Display || choiceId),
			isChoice: true as const
		}))
		.filter(entry => entry.value);

	if ((!questionText || isPlaceholderQuestionText(questionText)) && choiceEntries.length > 0) {
		return choiceEntries;
	}

	return [
		{
			entryKey: "question-text",
			choiceId: null,
			label: item.item_id,
			value: questionText,
			isChoice: false as const
		}
	];
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
			scaleGuidance: 0,
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
		scaleGuidance: Array.isArray(content.scale_guidance) ? content.scale_guidance.length : 0,
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

export function buildSpreadsheetRows(content: StructuredInstrumentContent | null): SpreadsheetRow[] {
	return getQuestionGroups(content).flatMap(group => {
		const sectionTitle = cleanInstrumentText(group.section?.title || group.items[0]?.block_title || group.blockKey);
		const sectionDescription = cleanInstrumentText(group.section?.intro_text);
		const sectionPrompt = cleanInstrumentText(group.section?.comment_prompt);
		return [
			{
				id: `section-${group.blockKey}`,
				number: `Section ${sectionTitle}`,
				section: sectionTitle,
				prompt: [
					sectionDescription ? `Description: ${sectionDescription}` : "",
					sectionPrompt ? `Notes Prompt: ${sectionPrompt}` : ""
				]
					.filter(Boolean)
					.join("\n\n")
			},
			...group.items.map(item => ({
				id: item.item_id,
				number: item.item_id,
				section: "—",
				prompt: getDisplayQuestionText(item)
			}))
		];
	});
}

/** Append `-draft` to a version label unless it already ends with it. */
export function toDraftLabel(versionLabel: string) {
	return versionLabel.endsWith("-draft") ? versionLabel : `${versionLabel}-draft`;
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
