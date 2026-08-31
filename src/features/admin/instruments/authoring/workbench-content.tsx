"use client";

import { Button } from "@/components/ui/button";
import type { UpdateDraft } from "@/features/admin/instruments/shared-components";
import type { StructuredInstrumentContent } from "@/features/admin/instruments/types";
import { AuditCopyEditor } from "@/features/admin/instruments/editors/audit-copy-editor";
import { LegalDocumentsEditor } from "@/features/admin/instruments/editors/legal-documents-editor";
import { PreambleEditor } from "@/features/admin/instruments/editors/preamble-editor";
import { PreAuditEditor } from "@/features/admin/instruments/editors/pre-audit-editor";
import { cn } from "@/lib/utils";

import { AuditorPreview } from "./auditor-preview";
import { DeveloperTools } from "./developer-tools";
import type { AuthoringSection, InstrumentContent } from "./schema";
import { SectionEditor } from "./section-editor";
import { SurveyMap } from "./survey-map";

export type WorkbenchMode =
	| "questions"
	| "preview"
	| "map"
	| "overview"
	| "preAudit"
	| "auditCopy"
	| "legal"
	| "developer";

const modes: { id: WorkbenchMode; label: string }[] = [
	{ id: "questions", label: "Questions" },
	{ id: "preview", label: "Preview" },
	{ id: "map", label: "Survey map" },
	{ id: "overview", label: "Overview" },
	{ id: "preAudit", label: "Pre-audit" },
	{ id: "auditCopy", label: "Audit copy" },
	{ id: "legal", label: "Legal" },
	{ id: "developer", label: "Developer" }
];

export function WorkbenchModePicker({
	mode,
	onChange
}: {
	mode: WorkbenchMode;
	onChange: (mode: WorkbenchMode) => void;
}) {
	return (
		<div
			className="flex flex-wrap gap-1 border-b border-border bg-background px-4 py-2"
			role="tablist"
			aria-label="Instrument workspace">
			{modes.map(item => (
				<Button
					key={item.id}
					type="button"
					role="tab"
					aria-selected={mode === item.id}
					variant={mode === item.id ? "secondary" : "ghost"}
					size="sm"
					onClick={() => onChange(item.id)}>
					{item.label}
				</Button>
			))}
		</div>
	);
}

export function WorkbenchContent({
	mode,
	content,
	section,
	onSectionChange,
	onLegacyUpdate,
	onImport
}: {
	mode: WorkbenchMode;
	content: InstrumentContent;
	section: AuthoringSection;
	onSectionChange: (section: AuthoringSection) => void;
	onLegacyUpdate: UpdateDraft;
	onImport: (content: InstrumentContent) => void;
}) {
	const legacyContent = content as unknown as StructuredInstrumentContent;
	return (
		<div className={cn("min-w-0", mode === "questions" ? "" : "mx-auto w-full max-w-6xl")}>
			{mode === "questions" ? <SectionEditor section={section} onChange={onSectionChange} /> : null}
			{mode === "preview" ? <AuditorPreview authoring={content.authoring} /> : null}
			{mode === "map" ? <SurveyMap authoring={content.authoring} /> : null}
			{mode === "overview" ? <PreambleEditor content={legacyContent} update={onLegacyUpdate} /> : null}
			{mode === "preAudit" ? <PreAuditEditor content={legacyContent} update={onLegacyUpdate} /> : null}
			{mode === "auditCopy" ? <AuditCopyEditor content={legacyContent} update={onLegacyUpdate} /> : null}
			{mode === "legal" ? <LegalDocumentsEditor content={legacyContent} update={onLegacyUpdate} /> : null}
			{mode === "developer" ? <DeveloperTools content={content} onImport={onImport} /> : null}
		</div>
	);
}
