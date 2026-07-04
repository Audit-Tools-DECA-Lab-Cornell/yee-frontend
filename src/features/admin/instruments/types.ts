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
};

export type InstrumentOption = {
	value: string;
	label: string;
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

export type InstrumentScaleRule = {
	value: string;
	label: string;
	add?: number | null;
	boost?: number | null;
	follow_up_behavior?: string | null;
	tag?: string | null;
};

export type InstrumentScaleGuidance = {
	id: string;
	title: string;
	prompt: string;
	description?: string;
	rules?: InstrumentScaleRule[];
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
	scale_guidance?: InstrumentScaleGuidance[];
	legal_documents?: InstrumentLegalDocument[];
};

export type DetailTabKey = "preamble" | "sections" | "spreadsheet" | "preAudit" | "scaleGuidance" | "legalDocuments";

export type InstrumentSummary = {
	name: string;
	key: string;
	version: string;
	sections: number;
	items: number;
	preAuditQuestions: number;
	scaleGuidance: number;
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
