"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getThemeByBlock } from "@/features/yee-audit/config/yee-domain-theme";
import { cn } from "@/lib/utils";

import { EditableField, FieldGroup, IdTag, type UpdateDraft } from "../shared-components";
import type { EditableItem, EditablePromptEntry, QuestionGroup, StructuredInstrumentContent } from "../types";
import {
	cleanInstrumentText,
	describeAnswerType,
	getEditablePromptEntries,
	getQuestionGroups,
	updateEditablePromptEntry
} from "../utils";

/**
 * Stable, DOM-safe fragment for a block key. Blocks carry spaces, colons and
 * `&`, and two different blocks could in principle slugify alike, so the group
 * index is appended to guarantee unique anchor and panel ids.
 */
function slugifyBlock(blockKey: string, index: number) {
	const slug =
		blockKey
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "") || "section";
	return `${slug}-${index}`;
}

function sectionHeading(group: QuestionGroup) {
	return cleanInstrumentText(group.section?.title || group.items[0]?.block_title || group.blockKey);
}

/**
 * Sections tab: one card per section, holding that section's copy and every
 * scoring item beneath it.
 *
 * The section → item → field nesting is carried by contrast, not just
 * indentation: the panel is recessed, section cards are raised onto it, each
 * card wears its domain color as a left rail plus header tint, and field groups
 * are inset again. Each level is a distinguishable surface, so it stays obvious
 * which section and which question is being edited.
 */
export function SectionTextEditor({ content, update }: { content: StructuredInstrumentContent; update: UpdateDraft }) {
	const idBase = React.useId();
	const groups = getQuestionGroups(content);
	const firstBlockKey = groups[0]?.blockKey;
	const [expanded, setExpanded] = React.useState<ReadonlySet<string>>(
		() => new Set(firstBlockKey ? [firstBlockKey] : [])
	);

	const toggle = React.useCallback((blockKey: string) => {
		setExpanded(current => {
			const next = new Set(current);
			if (next.has(blockKey)) next.delete(blockKey);
			else next.add(blockKey);
			return next;
		});
	}, []);

	const reveal = React.useCallback((blockKey: string) => {
		setExpanded(current => (current.has(blockKey) ? current : new Set(current).add(blockKey)));
	}, []);

	if (groups.length === 0) {
		return <p className="text-sm text-muted-foreground">This version has no sections.</p>;
	}

	return (
		<div className="xl:grid xl:grid-cols-[13rem_minmax(0,1fr)] xl:gap-6">
			<SectionIndex groups={groups} idBase={idBase} onReveal={reveal} />
			<div className="space-y-4">
				{groups.map((group, index) => (
					<SectionCard
						key={group.blockKey}
						group={group}
						groupIndex={index}
						content={content}
						update={update}
						idBase={idBase}
						isOpen={expanded.has(group.blockKey)}
						onToggle={() => toggle(group.blockKey)}
					/>
				))}
			</div>
		</div>
	);
}

/** Sticky jump list, wide screens only. Mirrors each section's domain color. */
function SectionIndex({
	groups,
	idBase,
	onReveal
}: {
	groups: QuestionGroup[];
	idBase: string;
	onReveal: (blockKey: string) => void;
}) {
	return (
		<nav aria-label="Instrument sections" className="hidden xl:block">
			<ul className="sticky top-6 space-y-0.5">
				{groups.map((group, index) => {
					const theme = getThemeByBlock(group.blockKey);
					return (
						<li key={group.blockKey}>
							<a
								href={`#${idBase}-section-${slugifyBlock(group.blockKey, index)}`}
								onClick={() => onReveal(group.blockKey)}
								className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
								<span
									aria-hidden
									className={cn(
										"size-2 shrink-0 rounded-full",
										theme ? theme.railClass : "bg-border"
									)}
								/>
								<span className="min-w-0 flex-1 truncate">{sectionHeading(group)}</span>
								<span className="shrink-0 tabular-nums text-xs opacity-70">{group.items.length}</span>
							</a>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}

function SectionCard({
	group,
	groupIndex,
	content,
	update,
	idBase,
	isOpen,
	onToggle
}: {
	group: QuestionGroup;
	groupIndex: number;
	content: StructuredInstrumentContent;
	update: UpdateDraft;
	idBase: string;
	isOpen: boolean;
	onToggle: () => void;
}) {
	const theme = getThemeByBlock(group.blockKey);
	const slug = slugifyBlock(group.blockKey, groupIndex);
	const anchorId = `${idBase}-section-${slug}`;
	const panelId = `${idBase}-panel-${slug}`;
	const headingId = `${idBase}-heading-${slug}`;
	const sectionIndex = (content.sections ?? []).findIndex(candidate => candidate.block === group.blockKey);
	const section = sectionIndex >= 0 ? content.sections?.[sectionIndex] : undefined;
	const scoringItems = content.scoring_items ?? [];

	return (
		<section
			id={anchorId}
			aria-labelledby={headingId}
			className="scroll-mt-4 overflow-hidden rounded-lg border border-border bg-card shadow-card">
			<div className="flex items-stretch">
				<div aria-hidden className={cn("w-1.5 shrink-0", theme ? theme.railClass : "bg-border")} />
				<div className="min-w-0 flex-1">
					<h3 id={headingId}>
						<button
							type="button"
							onClick={onToggle}
							aria-expanded={isOpen}
							aria-controls={panelId}
							className={cn(
								"flex w-full items-center gap-3 px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
								theme ? theme.headerClass : "bg-muted text-foreground"
							)}>
							<ChevronDown
								aria-hidden
								className={cn("size-4 shrink-0 transition-transform", isOpen ? "" : "-rotate-90")}
							/>
							<span className="min-w-0 flex-1 break-words text-base font-semibold">
								{sectionHeading(group)}
							</span>
							<span className="shrink-0 tabular-nums text-xs font-medium opacity-80">
								{group.items.length} {group.items.length === 1 ? "question" : "questions"}
							</span>
						</button>
					</h3>

					{isOpen ? (
						<div id={panelId} className="space-y-4 border-t border-border p-4">
							{section ? (
								<FieldGroup label="Section copy">
									<EditableField
										label="Section title"
										value={section.title ?? ""}
										onChange={value =>
											update(draft => {
												const next = [...(draft.sections ?? [])];
												if (!next[sectionIndex]) return;
												next[sectionIndex] = { ...next[sectionIndex], title: value };
												draft.sections = next;
											})
										}
									/>
									<EditableField
										label="Instructions"
										value={section.intro_text ?? ""}
										multiline
										className="min-h-32"
										onChange={value =>
											update(draft => {
												const next = [...(draft.sections ?? [])];
												if (!next[sectionIndex]) return;
												next[sectionIndex] = { ...next[sectionIndex], intro_text: value };
												draft.sections = next;
											})
										}
									/>
									<EditableField
										label="Optional comment prompt"
										value={section.comment_prompt ?? ""}
										multiline
										className="min-h-[5rem]"
										onChange={value =>
											update(draft => {
												const next = [...(draft.sections ?? [])];
												if (!next[sectionIndex]) return;
												next[sectionIndex] = { ...next[sectionIndex], comment_prompt: value };
												draft.sections = next;
											})
										}
									/>
								</FieldGroup>
							) : null}

							{group.items.length === 0 ? (
								<p className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
									This section carries copy and context for auditors but has no scored questions, so
									there is nothing to word here.
								</p>
							) : (
								group.items.map(item => (
									<ScoringItemEditor
										key={item.item_id}
										item={item}
										itemIndex={scoringItems.findIndex(
											candidate => candidate.item_id === item.item_id
										)}
										theme={theme}
										update={update}
									/>
								))
							)}
						</div>
					) : null}
				</div>
			</div>
		</section>
	);
}

function ScoringItemEditor({
	item,
	itemIndex,
	theme,
	update
}: {
	item: EditableItem;
	itemIndex: number;
	theme: ReturnType<typeof getThemeByBlock>;
	update: UpdateDraft;
}) {
	const entries = getEditablePromptEntries(item);
	const sharedPrompt = entries.filter(entry => entry.target === "sharedPrompt");
	const questions = entries.filter(entry => entry.target === "question");
	const answerOptions = entries.filter(entry => entry.target === "answerOption");

	const onEntryChange = (entry: EditablePromptEntry, value: string) =>
		update(draft => {
			const items = [...(draft.scoring_items ?? [])];
			const currentItem = items[itemIndex];
			if (itemIndex < 0 || !currentItem) return;
			items[itemIndex] = updateEditablePromptEntry(currentItem, entry, value);
			draft.scoring_items = items;
		});

	return (
		<article
			// Named so the item is addressable as a group: assistive tech announces
			// which question card "Question 1" belongs to, instead of the ID being
			// crammed into every control's aria-label (which would override the
			// visible label text).
			aria-label={item.item_id}
			className={cn(
				"rounded-md border border-border bg-card transition focus-within:ring-2 focus-within:ring-offset-1 focus-within:ring-offset-card",
				theme ? theme.ringClass : "focus-within:ring-ring"
			)}>
			<div className="flex flex-wrap items-center gap-2 rounded-t-md border-b border-border bg-muted px-3 py-2">
				<IdTag>{item.item_id}</IdTag>
				{item.item_kind ? <IdTag>{item.item_kind}</IdTag> : null}
				<Badge variant="secondary">{describeAnswerType(item)}</Badge>
			</div>
			<div className="space-y-3 p-3">
				{sharedPrompt.map(entry => (
					<EntryField
						key={entry.entryKey}
						item={item}
						entry={entry}
						multiline
						description="Shown above the questions below. Leave blank if the questions stand alone."
						onChange={value => onEntryChange(entry, value)}
					/>
				))}

				{questions.length > 0 ? (
					<FieldGroup label={`Questions (${questions.length})`} hint="What the auditor answers.">
						{questions.map(entry => (
							<EntryField
								key={entry.entryKey}
								item={item}
								entry={entry}
								multiline
								onChange={value => onEntryChange(entry, value)}
							/>
						))}
					</FieldGroup>
				) : null}

				{answerOptions.length > 0 ? (
					<FieldGroup
						label={`Answer options (${answerOptions.length})`}
						hint={
							questions.length > 0
								? "The choices offered for every question above."
								: "The choices offered for the prompt above."
						}>
						{answerOptions.map(entry => (
							<EntryField
								key={entry.entryKey}
								item={item}
								entry={entry}
								onChange={value => onEntryChange(entry, value)}
							/>
						))}
					</FieldGroup>
				) : null}
			</div>
		</article>
	);
}

/**
 * One editable prompt/question/answer string.
 *
 * Answer options are short labels ("Yes", "Poor"), so they get a single-line
 * input; prompts and questions are full sentences and get a textarea. The
 * control's size is a signifier — a five-row box invites a paragraph.
 */
function EntryField({
	item,
	entry,
	multiline = false,
	description,
	onChange
}: {
	item: EditableItem;
	entry: EditablePromptEntry;
	multiline?: boolean;
	description?: string;
	onChange: (value: string) => void;
}) {
	const fieldId = `instrument-${item.item_id}-${entry.entryKey}`;
	const descriptionId = description ? `${fieldId}-description` : undefined;
	const placeholder = entry.target === "answerOption" ? "Answer label" : "Question or prompt text";

	return (
		<div className="space-y-1.5">
			<Label htmlFor={fieldId}>{entry.label}</Label>
			{description ? (
				<p id={descriptionId} className="text-xs text-muted-foreground">
					{description}
				</p>
			) : null}
			{multiline ? (
				<Textarea
					id={fieldId}
					value={entry.value}
					aria-describedby={descriptionId}
					placeholder={placeholder}
					className="min-h-[4.5rem]"
					onChange={event => onChange(event.target.value)}
				/>
			) : (
				<Input
					id={fieldId}
					value={entry.value}
					aria-describedby={descriptionId}
					placeholder={placeholder}
					onChange={event => onChange(event.target.value)}
				/>
			)}
		</div>
	);
}
