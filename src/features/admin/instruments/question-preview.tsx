import { Badge } from "@/components/ui/badge";

import { IdTag } from "./shared-components";
import type { EditableItem } from "./types";
import { cleanInstrumentText, describeAnswerType, getDisplayQuestionText, isPlaceholderQuestionText } from "./utils";

export function QuestionPreview({ item }: { item: EditableItem }) {
	const sharedPrompt = cleanInstrumentText(item.question_text ?? "");
	const hasSharedPrompt = Boolean(sharedPrompt) && !isPlaceholderQuestionText(sharedPrompt);
	const questions = Object.entries(item.choices ?? {});
	const answerOptions = Object.entries(item.answers ?? {});
	const fallbackPrompt = questions.length === 0 ? getDisplayQuestionText(item) : "";

	return (
		<div className="rounded-md border border-border bg-card p-4">
			<div className="flex flex-wrap items-center gap-2">
				<IdTag>{item.item_id}</IdTag>
				{item.item_kind ? <IdTag>{item.item_kind}</IdTag> : null}
				<Badge variant="secondary">{describeAnswerType(item)}</Badge>
			</div>
			{hasSharedPrompt ? (
				<p className="mt-3 whitespace-pre-wrap break-words text-base font-medium text-foreground">
					{sharedPrompt}
				</p>
			) : null}
			{fallbackPrompt ? (
				<p className="mt-3 whitespace-pre-wrap break-words text-base font-medium text-foreground">
					{fallbackPrompt}
				</p>
			) : null}
			{questions.length > 0 ? (
				<div className="mt-4 space-y-2">
					<p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
						Questions ({questions.length})
					</p>
					{questions.map(([questionId, question], index) => {
						const display = cleanInstrumentText(question.Display ?? "");
						return (
							<div
								key={`${item.item_id}-${questionId}`}
								className="rounded-md border border-border bg-muted px-3 py-2">
								<p className="text-xs font-medium text-muted-foreground">Question {index + 1}</p>
								<p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
									{display || "No question text"}
								</p>
							</div>
						);
					})}
				</div>
			) : null}
			{answerOptions.length > 0 ? (
				<div className="mt-4">
					<p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
						Answer options ({answerOptions.length})
					</p>
					<div className="mt-2 flex flex-wrap gap-2">
						{answerOptions.map(([answerId, answer], index) => {
							const display = cleanInstrumentText(answer.Display ?? "");
							return (
								<span
									key={`${item.item_id}-${answerId}`}
									className="max-w-full whitespace-normal break-words rounded-full border border-border bg-muted px-3 py-1 text-sm text-foreground">
									{display || `Answer option ${index + 1} is blank`}
								</span>
							);
						})}
					</div>
				</div>
			) : null}
		</div>
	);
}
