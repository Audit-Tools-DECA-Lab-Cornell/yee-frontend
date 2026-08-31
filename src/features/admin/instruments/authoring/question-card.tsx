"use client";

import { ArrowDown, ArrowUp, Copy, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

import { OptionEditor } from "./option-editor";
import type { AuthoringQuestion } from "./schema";

export function QuestionCard({
	question,
	index,
	count,
	onChange,
	onMove,
	onDuplicate,
	onRemove
}: {
	question: AuthoringQuestion;
	index: number;
	count: number;
	onChange: (question: AuthoringQuestion) => void;
	onMove: (direction: -1 | 1) => void;
	onDuplicate: () => void;
	onRemove: () => void;
}) {
	const promptId = `question-${question.id}`;
	const followUp = question.followUp;

	function toggleFollowUp() {
		if (followUp) {
			onChange({ ...question, followUp: null });
			return;
		}
		onChange({
			...question,
			followUp: {
				triggerOptionIds: question.primary.options.slice(0, 1).map(option => option.id),
				requiredWhenShown: true,
				prompt: "If yes, please rate the condition of this feature or area.",
				options: [
					{ id: "1", label: "Poor", score: 0 },
					{ id: "2", label: "Acceptable", score: 1 },
					{ id: "3", label: "Great", score: 2 }
				]
			}
		});
	}

	return (
		<article
			id={`question-card-${question.id}`}
			className="scroll-mt-28 overflow-hidden rounded-md border border-border bg-card shadow-xs">
			<header className="flex flex-col gap-3 border-b border-border bg-muted/50 px-4 py-3 md:flex-row md:items-center md:justify-between">
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-sm font-semibold text-foreground">Question {index + 1}</span>
					<code className="text-xs text-muted-foreground">{question.id}</code>
					<Badge variant={followUp ? "secondary" : "outline"}>
						{followUp ? "Has follow-up" : "Single question"}
					</Badge>
					{question.responseBinding ? (
						<Badge variant="outline">Scored binding</Badge>
					) : (
						<Badge variant="warning">New structure</Badge>
					)}
				</div>
				<div className="flex flex-wrap gap-1">
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={() => onMove(-1)}
						disabled={index === 0}
						aria-label={`Move question ${index + 1} up`}>
						<ArrowUp aria-hidden="true" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={() => onMove(1)}
						disabled={index === count - 1}
						aria-label={`Move question ${index + 1} down`}>
						<ArrowDown aria-hidden="true" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={onDuplicate}
						aria-label={`Duplicate question ${index + 1}`}>
						<Copy aria-hidden="true" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={onRemove}
						aria-label={`Remove question ${index + 1}`}>
						<Trash2 aria-hidden="true" />
					</Button>
				</div>
			</header>
			<div className="space-y-5 p-4">
				<Field label="Question wording" htmlFor={promptId} required>
					<Textarea
						id={promptId}
						value={question.prompt}
						onChange={event => onChange({ ...question, prompt: event.target.value })}
						className="min-h-24"
					/>
				</Field>
				<OptionEditor
					idPrefix={`${promptId}-primary`}
					label="Answer options"
					options={question.primary.options}
					triggerIds={followUp?.triggerOptionIds}
					onChange={options => onChange({ ...question, primary: { ...question.primary, options } })}
					onTriggerChange={
						followUp
							? triggerOptionIds => onChange({ ...question, followUp: { ...followUp, triggerOptionIds } })
							: undefined
					}
				/>
				<div className="flex items-center justify-between gap-4 rounded-md border border-dashed border-border p-4">
					<div>
						<p className="text-sm font-semibold text-foreground">Conditional follow-up</p>
						<p className="text-xs text-muted-foreground">
							Shown only after one of the checked primary answers.
						</p>
					</div>
					<Button type="button" variant={followUp ? "outline" : "default"} size="sm" onClick={toggleFollowUp}>
						{followUp ? "Remove follow-up" : "Add follow-up"}
					</Button>
				</div>
				{followUp ? (
					<div className="space-y-4 rounded-md border-l-4 border-primary/40 bg-muted/35 p-4">
						<Field label="Follow-up wording" htmlFor={`${promptId}-follow-up`} required>
							<Textarea
								id={`${promptId}-follow-up`}
								value={followUp.prompt}
								onChange={event =>
									onChange({ ...question, followUp: { ...followUp, prompt: event.target.value } })
								}
							/>
						</Field>
						<label className="flex items-center gap-2 text-sm text-foreground">
							<input
								type="checkbox"
								checked={followUp.requiredWhenShown}
								onChange={event =>
									onChange({
										...question,
										followUp: { ...followUp, requiredWhenShown: event.target.checked }
									})
								}
							/>
							Required when shown
						</label>
						<OptionEditor
							idPrefix={`${promptId}-follow-up-options`}
							label="Follow-up options"
							options={followUp.options}
							onChange={options => onChange({ ...question, followUp: { ...followUp, options } })}
						/>
					</div>
				) : null}
			</div>
		</article>
	);
}
