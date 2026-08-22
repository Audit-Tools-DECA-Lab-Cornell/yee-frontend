"use client";

import { getThemeByDomainKey } from "@/features/yee-audit/config/yee-domain-theme";
import { EditableField, FieldGroup, IdTag, type UpdateDraft } from "../shared-components";
import type { InstrumentWeighting, StructuredInstrumentContent } from "../types";

/**
 * Audit Copy tab: the auditor-facing strings that live outside sections.
 *
 * These are published to every auditor (the weighting step, the shared
 * condition follow-up, and the final comments prompt) but had no editor — the
 * only way to reach them was the raw JSON textarea, which is a poor place to
 * ask a non-engineer to work.
 *
 * Labels only. Weighting option `value`s and domain `key`s are the contract the
 * mobile and web audit flows bind to, so this tab never adds, removes, or
 * reorders them.
 */
export function AuditCopyEditor({ content, update }: { content: StructuredInstrumentContent; update: UpdateDraft }) {
	const weighting = content.weighting ?? {};
	const options = weighting.options ?? [];
	const domains = weighting.domains ?? [];

	function updateWeighting(mutator: (draft: InstrumentWeighting) => void) {
		update(draft => {
			const next: InstrumentWeighting = { ...(draft.weighting ?? {}) };
			mutator(next);
			draft.weighting = next;
		});
	}

	return (
		<div className="space-y-4">
			<FieldGroup label="Condition follow-up" hint="Shown under every question an auditor answers “yes” to.">
				<EditableField
					label="Condition prompt"
					value={content.condition_prompt ?? ""}
					multiline
					className="min-h-[4.5rem]"
					onChange={value =>
						update(draft => {
							draft.condition_prompt = value;
						})
					}
				/>
			</FieldGroup>

			<FieldGroup label="Final comments" hint="Shown on the review step, before an auditor submits.">
				<EditableField
					label="Final comments prompt"
					value={content.final_comments_prompt ?? ""}
					onChange={value =>
						update(draft => {
							draft.final_comments_prompt = value;
						})
					}
				/>
			</FieldGroup>

			<FieldGroup label="Weighting step" hint="Where auditors rate how much each domain matters to them.">
				<EditableField
					label="Title"
					value={weighting.title ?? ""}
					onChange={value =>
						updateWeighting(draft => {
							draft.title = value;
						})
					}
				/>
				<EditableField
					label="Description"
					value={weighting.description ?? ""}
					multiline
					className="min-h-[4.5rem]"
					onChange={value =>
						updateWeighting(draft => {
							draft.description = value;
						})
					}
				/>
			</FieldGroup>

			{options.length > 0 ? (
				<FieldGroup
					label={`Weighting scale (${options.length})`}
					hint="The importance choices offered on the weighting step.">
					{options.map((option, index) => (
						<div key={option.value} className="space-y-1.5">
							<EditableField
								label={`Option ${index + 1}`}
								value={option.label ?? ""}
								onChange={value =>
									updateWeighting(draft => {
										const nextOptions = [...(draft.options ?? [])];
										if (!nextOptions[index]) return;
										nextOptions[index] = { ...nextOptions[index], label: value };
										draft.options = nextOptions;
									})
								}
							/>
							<IdTag>{option.value}</IdTag>
						</div>
					))}
				</FieldGroup>
			) : null}

			{domains.length > 0 ? (
				<FieldGroup
					label={`Domain prompts (${domains.length})`}
					hint="One prompt per audit domain. Keys and order are fixed.">
					{domains.map((domain, index) => (
						<EditableField
							key={domain.key}
							label={domain.label || domain.key}
							labelColor={getThemeByDomainKey(domain.key)?.textHex}
							value={domain.prompt ?? ""}
							multiline
							className="min-h-[4.5rem]"
							onChange={value =>
								updateWeighting(draft => {
									const nextDomains = [...(draft.domains ?? [])];
									if (!nextDomains[index]) return;
									nextDomains[index] = { ...nextDomains[index], prompt: value };
									draft.domains = nextDomains;
								})
							}
						/>
					))}
				</FieldGroup>
			) : null}

			{options.length === 0 && domains.length === 0 && !weighting.title && !weighting.description ? (
				<p className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
					This version has no weighting step copy.
				</p>
			) : null}
		</div>
	);
}
