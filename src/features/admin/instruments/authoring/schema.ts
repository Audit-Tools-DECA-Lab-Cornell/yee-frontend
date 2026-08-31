import { z } from "zod";

export const authoringOptionSchema = z.object({
	id: z.string().min(1),
	label: z.string(),
	score: z.number().int()
});

export const authoringFollowUpSchema = z.object({
	triggerOptionIds: z.array(z.string()),
	requiredWhenShown: z.boolean().default(true),
	prompt: z.string(),
	options: z.array(authoringOptionSchema)
});

export const authoringQuestionSchema = z.object({
	id: z.string().min(1),
	prompt: z.string(),
	primary: z.object({
		type: z.literal("single_select").default("single_select"),
		options: z.array(authoringOptionSchema)
	}),
	followUp: authoringFollowUpSchema.nullable(),
	scoring: z.object({
		method: z.enum(["option_score", "presence_condition_product"]),
		domain: z.string().min(1)
	}),
	responseBinding: z
		.object({
			presenceItemId: z.string(),
			choiceId: z.string(),
			conditionItemId: z.string().nullable()
		})
		.nullable()
});

export const authoringSectionSchema = z.object({
	id: z.string().min(1),
	title: z.string(),
	instructions: z.string(),
	commentPrompt: z.string(),
	questions: z.array(authoringQuestionSchema)
});

export const authoringInstrumentSchema = z.object({
	schemaVersion: z.literal(2),
	sections: z.array(authoringSectionSchema)
});

export const instrumentContentSchema = z
	.object({
		survey_name: z.string(),
		version: z.string(),
		authoring: authoringInstrumentSchema
	})
	.passthrough();

export const instrumentVersionSummarySchema = z.object({
	id: z.string().uuid(),
	instrument_key: z.string(),
	instrument_version: z.string(),
	parent_instrument_id: z.string().uuid().nullable(),
	is_active: z.boolean(),
	lifecycle: z.enum(["active", "draft", "archived"]),
	usage_count: z.number().int().nonnegative(),
	schema_generation: z.enum(["legacy", "authoring_v2"]),
	compatibility_status: z.enum(["legacy", "copy_only", "migration_required", "invalid"]),
	created_at: z.string(),
	updated_at: z.string()
});

export const instrumentVersionDetailSchema = instrumentVersionSummarySchema.extend({
	content: instrumentContentSchema
});

export const instrumentVersionListSchema = z.array(instrumentVersionSummarySchema);

export type AuthoringOption = z.infer<typeof authoringOptionSchema>;
export type AuthoringFollowUp = z.infer<typeof authoringFollowUpSchema>;
export type AuthoringQuestion = z.infer<typeof authoringQuestionSchema>;
export type AuthoringSection = z.infer<typeof authoringSectionSchema>;
export type AuthoringInstrument = z.infer<typeof authoringInstrumentSchema>;
export type InstrumentContent = z.infer<typeof instrumentContentSchema>;
export type InstrumentVersionSummary = z.infer<typeof instrumentVersionSummarySchema>;
export type InstrumentVersionDetail = z.infer<typeof instrumentVersionDetailSchema>;
