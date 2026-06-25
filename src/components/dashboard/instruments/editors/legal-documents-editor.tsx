"use client";

import { Badge } from "@/components/ui/badge";

import { EditableField, type UpdateDraft } from "../shared-components";
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
		return <p className="text-sm text-slate-500">This instrument has no legal documents.</p>;
	}

	return (
		<div className="space-y-4">
			{documents.map((document, index) => (
				<div key={document.id} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
							{cleanInstrumentText(document.document_type?.replaceAll("_", " ") || "Document")}
						</p>
						<Badge className="rounded-md bg-slate-100 text-slate-700 hover:bg-slate-100">
							{document.id}
						</Badge>
					</div>
					<EditableField
						label="Title"
						value={cleanInstrumentText(document.title)}
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
						label="Last Updated"
						value={document.last_updated ?? ""}
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
						value={cleanInstrumentText(document.content)}
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
