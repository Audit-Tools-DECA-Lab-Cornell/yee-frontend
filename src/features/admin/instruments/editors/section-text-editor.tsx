"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { EditableField, IdTag, type UpdateDraft } from "../shared-components";
import type { StructuredInstrumentContent } from "../types";
import { cleanInstrumentText, getEditablePromptEntries, getQuestionGroups } from "../utils";

/**
 * Sections tab: edit section titles/instructions/comment prompts and the
 * question (and choice) text for each scoring item, grouped by block.
 */
export function SectionTextEditor({ content, update }: { content: StructuredInstrumentContent; update: UpdateDraft }) {
	const sections = content.sections ?? [];
	const groups = getQuestionGroups(content);
	const scoringItems = content.scoring_items ?? [];

	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<p className="text-sm font-medium text-foreground">Section text</p>
				{sections.length === 0 ? (
					<p className="text-sm text-muted-foreground">This version has no sections.</p>
				) : (
					sections.map((section, index) => (
						<div
							key={`${section.block}-${index}`}
							className="space-y-3 rounded-md border border-border bg-muted/60 p-4">
							<p className="break-words text-sm font-semibold text-foreground">
								{cleanInstrumentText(section.title || section.block)}
							</p>
							<EditableField
								label="Section title"
								value={cleanInstrumentText(section.title)}
								onChange={value =>
									update(draft => {
										const next = [...(draft.sections ?? [])];
										if (!next[index]) return;
										next[index] = { ...next[index], title: value };
										draft.sections = next;
									})
								}
							/>
							<EditableField
								label="Instructions"
								value={cleanInstrumentText(section.intro_text)}
								multiline
								className="min-h-32"
								onChange={value =>
									update(draft => {
										const next = [...(draft.sections ?? [])];
										if (!next[index]) return;
										next[index] = { ...next[index], intro_text: value };
										draft.sections = next;
									})
								}
							/>
							<EditableField
								label="Optional comment prompt"
								value={cleanInstrumentText(section.comment_prompt)}
								multiline
								className="min-h-[5rem]"
								onChange={value =>
									update(draft => {
										const next = [...(draft.sections ?? [])];
										if (!next[index]) return;
										next[index] = { ...next[index], comment_prompt: value };
										draft.sections = next;
									})
								}
							/>
						</div>
					))
				)}
			</div>

			<div className="space-y-4">
				<p className="text-sm font-medium text-foreground">Question wording</p>
				{groups.map(group => (
					<div key={group.blockKey} className="space-y-3 rounded-md border border-border bg-muted/60 p-4">
						<p className="break-words text-sm font-semibold text-foreground">
							{cleanInstrumentText(group.section?.title || group.items[0]?.block_title || group.blockKey)}
						</p>
						{group.items.map(item => {
							const itemIndex = scoringItems.findIndex(candidate => candidate.item_id === item.item_id);
							const editableEntries = getEditablePromptEntries(item);
							return (
								<div
									key={item.item_id}
									className="space-y-2 rounded-md border border-border bg-card p-3">
									<IdTag>{item.item_id}</IdTag>
									{editableEntries.map(entry => (
										<div key={entry.entryKey} className="space-y-2">
											<Label>{entry.label}</Label>
											<Textarea
												value={entry.value}
												className="min-h-[5rem]"
												onChange={event =>
													update(draft => {
														const items = [...(draft.scoring_items ?? [])];
														if (itemIndex < 0 || !items[itemIndex]) return;
														if (entry.isChoice && entry.choiceId) {
															const currentChoices = {
																...(items[itemIndex].choices ?? {})
															};
															currentChoices[entry.choiceId] = {
																...(currentChoices[entry.choiceId] ?? {}),
																Display: event.target.value
															};
															items[itemIndex] = {
																...items[itemIndex],
																choices: currentChoices
															};
														} else {
															items[itemIndex] = {
																...items[itemIndex],
																question_text: event.target.value
															};
														}
														draft.scoring_items = items;
													})
												}
											/>
										</div>
									))}
								</div>
							);
						})}
					</div>
				))}
			</div>
		</div>
	);
}
