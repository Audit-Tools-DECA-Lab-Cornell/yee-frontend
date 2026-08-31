export type InstrumentOption = {
	value: string;
	label: string;
};

export type InstrumentWeightingDomain = {
	key: string;
	label: string;
	prompt: string;
};

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

export type StructuredInstrumentContent = {
	survey_name?: string;
	version?: string;
	preamble?: string[];
	pre_audit_questions?: InstrumentPreAuditQuestion[];
	legal_documents?: InstrumentLegalDocument[];
	weighting?: InstrumentWeighting;
	condition_prompt?: string;
	final_comments_prompt?: string;
};
