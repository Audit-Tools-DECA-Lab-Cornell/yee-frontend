import type { InstrumentResponse } from "../../src/features/yee-audit/api/yee-instrument";
import type { YeeSubmissionRecord } from "../../src/features/yee-audit/api/yee-audit-api";
import type { YeeScoreResult } from "../../src/features/yee-audit/config/yee-audit-config";

/**
 * Shared fixture for export tests. Exercises every response branch the
 * instrument walk handles: a plain single-choice question, a matrix question
 * with a paired condition item, and a placeholder-question fallback.
 */

const score: YeeScoreResult = {
	total_raw_score: 56,
	total_raw_maximum: 125,
	raw_domain_scores: {
		access: 7,
		activitySpaces: 13,
		amenities: 9,
		experienceOfSpace: 11,
		aestheticsAndCare: 8,
		useAndUsability: 8
	},
	raw_domain_maximums: {
		access: 15,
		activitySpaces: 25,
		amenities: 20,
		experienceOfSpace: 25,
		aestheticsAndCare: 20,
		useAndUsability: 20
	},
	total_weighted_score: 1.03,
	total_weighted_maximum: 1.83,
	weighted_domain_scores: {
		access: 0.14,
		activitySpaces: 0.31,
		amenities: 0.18,
		experienceOfSpace: 0.22,
		aestheticsAndCare: 0.1,
		useAndUsability: 0.08
	},
	weighted_domain_maximums: {
		access: 0.3,
		activitySpaces: 0.37,
		amenities: 0.3,
		experienceOfSpace: 0.37,
		aestheticsAndCare: 0.25,
		useAndUsability: 0.24
	},
	selected_weights: {
		access: 2,
		activitySpaces: 1,
		amenities: 2,
		experienceOfSpace: 3,
		aestheticsAndCare: 2,
		useAndUsability: 2
	},
	normalized_weights: {
		access: 0.17,
		activitySpaces: 0.08,
		amenities: 0.17,
		experienceOfSpace: 0.25,
		aestheticsAndCare: 0.17,
		useAndUsability: 0.17
	},
	priority_gaps: {
		access: 0,
		activitySpaces: 0,
		amenities: 0,
		experienceOfSpace: 0,
		aestheticsAndCare: 0,
		useAndUsability: 0
	},
	category_scores: {},
	matched_scored_answers: 0,
	total_score: 56,
	section_scores: {}
};

export const sampleSubmission: YeeSubmissionRecord = {
	id: "11111111-1111-4111-8111-111111111111",
	place_id: "22222222-2222-4222-8222-222222222222",
	place_name: "Riverside Park",
	auditor_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
	auditor_generated_id: "AUD007",
	submitted_at: "2026-06-12T14:30:00Z",
	participant_info: {
		participant_id: "P-042",
		audit_date: "2026-06-12",
		visit_frequency: "Weekly",
		season: "Summer",
		weather: "Sunny, 24°C",
		comments: 'Overall a welcoming space; the "north gate" needs signage.',
		weighting_comments: "Weighted access highest for wheelchair users.",
		domain_weights: {
			access: "2",
			activitySpaces: "1",
			amenities: "2",
			experienceOfSpace: "3",
			aestheticsAndCare: "2",
			useAndUsability: "2"
		},
		section_comments: {
			access: "Ramps present, tactile paving missing.",
			amenities: "Water fountain, no shade near seating."
		}
	},
	responses: {
		"access-q1": "yes",
		"access-matrix": { seating: "great", lighting: "acceptable" },
		"access-matrix-cond": { seating: "acceptable", lighting: "poor" },
		"amenities-q1": "partial"
	},
	score
};

export const sampleInstrument: InstrumentResponse = {
	survey_name: "YEE Audit Instrument",
	version: "1.0",
	sections: [],
	scoring_items: [
		{
			item_id: "access-q1",
			base_question_id: "access-q1",
			block: "Access",
			question_text: "Is there a step-free route from the street to the play area",
			item_kind: "presence",
			choices: { yes: { Display: "Yes" }, no: { Display: "No" } },
			answers: {}
		},
		{
			item_id: "access-matrix",
			base_question_id: "access-matrix",
			block: "Access",
			question_text: "Rate the condition of each element",
			item_kind: "presence",
			choices: { seating: { Display: "Seating" }, lighting: { Display: "Lighting" } },
			answers: { poor: { Display: "Poor" }, acceptable: { Display: "Acceptable" }, great: { Display: "Great" } }
		},
		{
			item_id: "access-matrix-cond",
			base_question_id: "access-matrix",
			block: "Access",
			question_text: "If yes, rate the condition",
			item_kind: "condition",
			choices: { seating: { Display: "Seating" }, lighting: { Display: "Lighting" } },
			answers: { poor: { Display: "Poor" }, acceptable: { Display: "Acceptable" }, great: { Display: "Great" } }
		},
		{
			item_id: "amenities-q1",
			base_question_id: "amenities-q1",
			block: "Amenities",
			// Placeholder text triggers the item_id-as-prompt fallback branch.
			question_text: "Click to write the question text",
			item_kind: "presence",
			choices: { full: { Display: "Fully" }, partial: { Display: "Partially" }, none: { Display: "None" } },
			answers: {}
		}
	]
};
