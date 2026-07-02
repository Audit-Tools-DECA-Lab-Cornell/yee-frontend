"use client";

import { Badge } from "@/components/ui/badge";

import { EditableField, type UpdateDraft } from "../shared-components";
import type { StructuredInstrumentContent } from "../types";
import { cleanInstrumentText } from "../utils";

/** Pre-Audit tab: light text editing of pre-audit questions and option labels. */
export function PreAuditEditor({ content, update }: { content: StructuredInstrumentContent; update: UpdateDraft }) {
	const questions = content.pre_audit_questions ?? [];

	if (questions.length === 0) {
		return <p className="text-sm text-slate-500">This instrument has no pre-audit questions.</p>;
	}

	return (
		<div className="space-y-4">
			{questions.map((question, index) => (
				<div key={question.id} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
					<div className="flex flex-wrap items-center gap-2">
						<Badge className="rounded-md bg-slate-100 text-slate-700 hover:bg-slate-100">
							{question.id}
						</Badge>
						{question.auto_generated ? (
							<Badge className="rounded-md bg-slate-900 text-white hover:bg-slate-900">
								Auto generated
							</Badge>
						) : null}
						<Badge className="rounded-md bg-slate-100 text-slate-700 hover:bg-slate-100">
							{question.multi_select ? "Multi select" : "Single select"}
						</Badge>
					</div>
					<EditableField
						label="Title"
						value={cleanInstrumentText(question.title)}
						onChange={value =>
							update(draft => {
								const next = [...(draft.pre_audit_questions ?? [])];
								if (!next[index]) return;
								next[index] = { ...next[index], title: value };
								draft.pre_audit_questions = next;
							})
						}
					/>
					<EditableField
						label="Prompt"
						value={cleanInstrumentText(question.prompt)}
						multiline
						onChange={value =>
							update(draft => {
								const next = [...(draft.pre_audit_questions ?? [])];
								if (!next[index]) return;
								next[index] = { ...next[index], prompt: value };
								draft.pre_audit_questions = next;
							})
						}
					/>
					<EditableField
						label="Description"
						value={cleanInstrumentText(question.description)}
						multiline
						onChange={value =>
							update(draft => {
								const next = [...(draft.pre_audit_questions ?? [])];
								if (!next[index]) return;
								next[index] = { ...next[index], description: value };
								draft.pre_audit_questions = next;
							})
						}
					/>
					{(question.options ?? []).length > 0 ? (
						<div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
							<p className="text-xs font-medium uppercase tracking-wide text-slate-500">Option labels</p>
							{(question.options ?? []).map((option, optionIndex) => (
								<EditableField
									key={`${question.id}-${option.value}`}
									label={`Option · ${option.value}`}
									value={cleanInstrumentText(option.label)}
									onChange={value =>
										update(draft => {
											const next = [...(draft.pre_audit_questions ?? [])];
											if (!next[index]) return;
											const options = [...(next[index].options ?? [])];
											if (!options[optionIndex]) return;
											options[optionIndex] = { ...options[optionIndex], label: value };
											next[index] = { ...next[index], options };
											draft.pre_audit_questions = next;
										})
									}
								/>
							))}
						</div>
					) : null}
				</div>
			))}
		</div>
	);
}
