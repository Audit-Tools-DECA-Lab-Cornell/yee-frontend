"use client";

import { EditableField, IdTag, type UpdateDraft } from "../shared-components";
import type { StructuredInstrumentContent } from "../types";
import { cleanInstrumentText } from "../utils";

/** Legal Documents tab: light text editing of document titles and bodies. */
export function LegalDocumentsEditor({
	content,
	update
}: {
	content: StructuredInstrumentContent;
	update: UpdateDraft;
}) {
	const documents = content.legal_documents ?? [];

	if (documents.length === 0) {
		return <p className="text-sm text-muted-foreground">This version has no legal documents.</p>;
	}

	return (
		<div className="space-y-4">
			{documents.map((doc, index) => (
				<div key={doc.id} className="space-y-3 rounded-md border border-border bg-muted/60 p-4">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
							{cleanInstrumentText(doc.document_type?.replaceAll("_", " ") || "Document")}
						</p>
						<IdTag>{doc.id}</IdTag>
					</div>
					<EditableField
						label="Title"
						value={cleanInstrumentText(doc.title)}
						onChange={value =>
							update(draft => {
								const next = [...(draft.legal_documents ?? [])];
								if (!next[index]) return;
								next[index] = { ...next[index], title: value };
								draft.legal_documents = next;
							})
						}
					/>
					<EditableField
						label="Last updated"
						value={doc.last_updated ?? ""}
						onChange={value =>
							update(draft => {
								const next = [...(draft.legal_documents ?? [])];
								if (!next[index]) return;
								next[index] = { ...next[index], last_updated: value };
								draft.legal_documents = next;
							})
						}
					/>
					<EditableField
						label="Content"
						value={cleanInstrumentText(doc.content)}
						multiline
						className="min-h-[12rem]"
						onChange={value =>
							update(draft => {
								const next = [...(draft.legal_documents ?? [])];
								if (!next[index]) return;
								next[index] = { ...next[index], content: value };
								draft.legal_documents = next;
							})
						}
					/>
				</div>
			))}
		</div>
	);
}
