import type { InstrumentVersionRecord } from "@/features/workspaces/api/live-api";

export type { InstrumentVersionRecord };

export type EditableSection = {
	block: string;
	title?: string;
	intro_text?: string;
	comment_prompt?: string;
};

export type EditableItem = {
	item_id: string;
	base_question_id?: string;
	block?: string;
	block_title?: string;
	question_text?: string;
	item_kind?: string;
	choices?: Record<string, { Display?: string }>;
	answers?: Record<string, { Display?: string }>;
	score_entries?: readonly Record<string, unknown>[];
};

export type EditablePromptEntry =
	| {
			target: "sharedPrompt";
			entryKey: "question-text";
			label: "Shared prompt";
			value: string;
	  }
	| {
			target: "question" | "answerOption";
			entryKey: string;
			optionId: string;
			label: string;
			value: string;
	  };

export type InstrumentOption = {
	value: string;
	label: string;
};

/**
 * Backend `ScoringCompatibilityReport` (see `app/products/yee/schemas/instrument.py`),
 * returned inside the publish 409 body as `detail.scoring_compatibility`.
 * `missing_items` blocks publishing; `missing_choices` (`"QID1#1:2"`) is a warning.
 */
export type ScoringCompatibilityReport = {
	ok: boolean;
	scoring_version: string;
	required_item_count: number;
	present_item_count: number;
	missing_items: string[];
	missing_choices: string[];
};

/** Per-domain youth-weighting prompt. Keys mirror `YeeDomainKey` on the audit side. */
export type InstrumentWeightingDomain = {
	key: string;
	label: string;
	prompt: string;
};

/** Weighting step copy — `YeeInstrumentWeighting` in `app/yee_instrument_schema.py`. */
export type InstrumentWeighting = {
	title?: string;
	description?: string;
	options?: InstrumentOption[];
	domains?: InstrumentWeightingDomain[];
};

export type InstrumentPreAuditQuestion = {
	id: string;
	title: string;
	prompt: string;
	description?: string;
	options?: InstrumentOption[];
	multi_select?: boolean;
	required?: boolean;
	auto_generated?: boolean;
};

export type InstrumentLegalDocument = {
	id: string;
	title: string;
	last_updated?: string | null;
	content: string;
	document_type?: string | null;
};

/**
 * Loosely-typed view over the opaque YEE instrument `content` payload. Mirrors
 * the backend `yee_instrument_schema.py` shape (flat `scoring_items` grouped by
 * `block`, not nested sections-with-questions like Playspace).
 */
export type StructuredInstrumentContent = {
	survey_name?: string;
	version?: string;
	instrument_version?: string;
	instrument_name?: string;
	instrument_key?: string;
	sections?: EditableSection[];
	scoring_items?: EditableItem[];
	preamble?: string[];
	pre_audit_questions?: InstrumentPreAuditQuestion[];
	legal_documents?: InstrumentLegalDocument[];
	weighting?: InstrumentWeighting;
	condition_prompt?: string;
	final_comments_prompt?: string;
};

export type DetailTabKey = "preamble" | "sections" | "spreadsheet" | "preAudit" | "auditCopy" | "legalDocuments";

export type InstrumentSummary = {
	name: string;
	key: string;
	version: string;
	sections: number;
	items: number;
	preAuditQuestions: number;
	legalDocuments: number;
};

export type QuestionGroup = {
	blockKey: string;
	section: EditableSection | null;
	items: EditableItem[];
};

export type SpreadsheetGroup = {
	blockKey: string;
	sectionTitle: string;
	description?: string;
	notesPrompt?: string;
	items: { id: string; prompt: string }[];
};
