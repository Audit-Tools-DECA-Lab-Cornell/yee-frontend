import type { AuthoringInstrument } from "./schema";

export type AuthoringFinding = {
	code: string;
	message: string;
	questionId?: string;
};

export function validateAuthoring(authoring: AuthoringInstrument): AuthoringFinding[] {
	const findings: AuthoringFinding[] = [];
	const questionIds = new Set<string>();
	for (const section of authoring.sections) {
		if (!section.title.trim())
			findings.push({ code: "section_title_required", message: "Section title is required." });
		for (const question of section.questions) {
			if (questionIds.has(question.id)) {
				findings.push({
					code: "duplicate_question_id",
					message: "Question ID must be unique.",
					questionId: question.id
				});
			}
			questionIds.add(question.id);
			if (!question.prompt.trim()) {
				findings.push({
					code: "question_prompt_required",
					message: "Question wording is required.",
					questionId: question.id
				});
			}
			if (question.primary.options.length < 2) {
				findings.push({
					code: "primary_options_required",
					message: "Add at least two answer options.",
					questionId: question.id
				});
			}
			const optionIds = new Set(question.primary.options.map(option => option.id));
			if (optionIds.size !== question.primary.options.length) {
				findings.push({
					code: "duplicate_option_id",
					message: "Answer option IDs must be unique.",
					questionId: question.id
				});
			}
			if (question.followUp) {
				const unknownTrigger = question.followUp.triggerOptionIds.find(id => !optionIds.has(id));
				if (unknownTrigger) {
					findings.push({
						code: "unknown_trigger",
						message: "A follow-up trigger points to a missing answer option.",
						questionId: question.id
					});
				}
				if (!question.followUp.prompt.trim()) {
					findings.push({
						code: "follow_up_prompt_required",
						message: "Follow-up wording is required.",
						questionId: question.id
					});
				}
				if (question.followUp.options.length < 2) {
					findings.push({
						code: "follow_up_options_required",
						message: "Add at least two follow-up options.",
						questionId: question.id
					});
				}
			}
		}
	}
	return findings;
}
