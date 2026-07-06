"use client";

import { EditableField, IdTag, type UpdateDraft } from "../shared-components";
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
		return <p className="text-sm text-muted-foreground">This version has no scale guidance.</p>;
	}

	return (
		<div className="space-y-4">
			{scales.map((scale, index) => (
				<div key={scale.id} className="space-y-3 rounded-md border border-border bg-muted/60 p-4">
					<IdTag>{scale.id}</IdTag>
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
						<div className="space-y-3 rounded-md border border-border bg-card p-3">
							<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rules</p>
							{(scale.rules ?? []).map((rule, ruleIndex) => (
								<EditableField
									key={`${scale.id}-${rule.value}`}
									label={`Rule ${ruleIndex + 1}`}
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
