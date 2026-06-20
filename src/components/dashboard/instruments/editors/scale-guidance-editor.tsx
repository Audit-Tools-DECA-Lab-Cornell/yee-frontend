"use client";

import { Badge } from "@/components/ui/badge";

import { EditableField, type UpdateDraft } from "../shared-components";
import type { StructuredInstrumentContent } from "../types";
import { cleanInstrumentText } from "../utils";

/** Scale Guidance tab: light text editing of titles, prompts and rule labels. */
export function ScaleGuidanceEditor({
	content,
	update
}: {
	content: StructuredInstrumentContent;
	update: UpdateDraft;
}) {
	const scales = content.scale_guidance ?? [];

	if (scales.length === 0) {
		return <p className="text-sm text-slate-500">This instrument has no scale guidance.</p>;
	}

	return (
		<div className="space-y-4">
			{scales.map((scale, index) => (
				<div key={scale.id} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
					<Badge className="rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-100">{scale.id}</Badge>
					<EditableField
						label="Title"
						value={cleanInstrumentText(scale.title)}
						onChange={value =>
							update(draft => {
								const next = [...(draft.scale_guidance ?? [])];
								if (!next[index]) return;
								next[index] = { ...next[index], title: value };
								draft.scale_guidance = next;
							})
						}
					/>
					<EditableField
						label="Prompt"
						value={cleanInstrumentText(scale.prompt)}
						multiline
						onChange={value =>
							update(draft => {
								const next = [...(draft.scale_guidance ?? [])];
								if (!next[index]) return;
								next[index] = { ...next[index], prompt: value };
								draft.scale_guidance = next;
							})
						}
					/>
					<EditableField
						label="Description"
						value={cleanInstrumentText(scale.description)}
						multiline
						onChange={value =>
							update(draft => {
								const next = [...(draft.scale_guidance ?? [])];
								if (!next[index]) return;
								next[index] = { ...next[index], description: value };
								draft.scale_guidance = next;
							})
						}
					/>
					{(scale.rules ?? []).length > 0 ? (
						<div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
							<p className="text-xs font-medium uppercase tracking-wide text-slate-500">Rule labels</p>
							{(scale.rules ?? []).map((rule, ruleIndex) => (
								<EditableField
									key={`${scale.id}-${rule.value}`}
									label={`Rule · ${rule.value}`}
									value={cleanInstrumentText(rule.label)}
									onChange={value =>
										update(draft => {
											const next = [...(draft.scale_guidance ?? [])];
											if (!next[index]) return;
											const rules = [...(next[index].rules ?? [])];
											if (!rules[ruleIndex]) return;
											rules[ruleIndex] = { ...rules[ruleIndex], label: value };
											next[index] = { ...next[index], rules };
											draft.scale_guidance = next;
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
