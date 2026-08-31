"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getThemeByDomainKey } from "@/features/yee-audit/config/yee-domain-theme";
import { cn } from "@/lib/utils";

import { QuestionCard } from "./question-card";
import type { AuthoringQuestion, AuthoringSection } from "./schema";

function createQuestion(sectionId: string): AuthoringQuestion {
	return {
		id: `${sectionId}.question.${crypto.randomUUID()}`,
		prompt: "New question",
		primary: {
			type: "single_select",
			options: [
				{ id: `option.${crypto.randomUUID()}`, label: "Yes", score: 1 },
				{ id: `option.${crypto.randomUUID()}`, label: "No", score: 0 }
			]
		},
		followUp: null,
		scoring: { method: "option_score", domain: sectionId },
		responseBinding: null
	};
}

function duplicateQuestion(question: AuthoringQuestion): AuthoringQuestion {
	const copy = structuredClone(question);
	copy.id = `${question.id}.copy.${crypto.randomUUID()}`;
	copy.responseBinding = null;
	return copy;
}

export function SectionEditor({
	section,
	onChange
}: {
	section: AuthoringSection;
	onChange: (section: AuthoringSection) => void;
}) {
	const theme = getThemeByDomainKey(section.id);

	function updateQuestion(index: number, question: AuthoringQuestion) {
		onChange({
			...section,
			questions: section.questions.map((candidate, questionIndex) =>
				questionIndex === index ? question : candidate
			)
		});
	}

	function moveQuestion(index: number, direction: -1 | 1) {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= section.questions.length) return;
		const questions = [...section.questions];
		[questions[index], questions[nextIndex]] = [questions[nextIndex], questions[index]];
		onChange({ ...section, questions });
	}

	return (
		<section className="space-y-5">
			<div className={cn("overflow-hidden rounded-md border border-border bg-card", theme?.card)}>
				<div className="flex items-stretch">
					<div className={cn("w-1 shrink-0 bg-primary", theme?.railClass)} aria-hidden="true" />
					<div className="grid flex-1 gap-4 p-5 lg:grid-cols-2">
						<Field label="Section title" htmlFor={`section-${section.id}-title`} required>
							<Input
								id={`section-${section.id}-title`}
								value={section.title}
								onChange={event => onChange({ ...section, title: event.target.value })}
							/>
						</Field>
						<Field label="Optional comment prompt" htmlFor={`section-${section.id}-comment`}>
							<Input
								id={`section-${section.id}-comment`}
								value={section.commentPrompt}
								onChange={event => onChange({ ...section, commentPrompt: event.target.value })}
							/>
						</Field>
						<Field
							label="Instructions"
							htmlFor={`section-${section.id}-instructions`}
							className="lg:col-span-2">
							<Textarea
								id={`section-${section.id}-instructions`}
								value={section.instructions}
								onChange={event => onChange({ ...section, instructions: event.target.value })}
								className="min-h-28"
							/>
						</Field>
					</div>
				</div>
			</div>

			<div className="flex items-center justify-between gap-4">
				<div>
					<h2 className="text-lg font-semibold text-foreground">Questions</h2>
					<p className="text-sm text-muted-foreground">
						Each question owns its wording, answers, scores, and optional follow-up.
					</p>
				</div>
				<Button
					type="button"
					onClick={() =>
						onChange({ ...section, questions: [...section.questions, createQuestion(section.id)] })
					}>
					<Plus aria-hidden="true" /> Add question
				</Button>
			</div>

			<div className="space-y-4">
				{section.questions.map((question, index) => (
					<QuestionCard
						key={question.id}
						question={question}
						index={index}
						count={section.questions.length}
						onChange={next => updateQuestion(index, next)}
						onMove={direction => moveQuestion(index, direction)}
						onDuplicate={() =>
							onChange({
								...section,
								questions: [
									...section.questions.slice(0, index + 1),
									duplicateQuestion(question),
									...section.questions.slice(index + 1)
								]
							})
						}
						onRemove={() =>
							onChange({
								...section,
								questions: section.questions.filter((_, questionIndex) => questionIndex !== index)
							})
						}
					/>
				))}
			</div>
		</section>
	);
}
