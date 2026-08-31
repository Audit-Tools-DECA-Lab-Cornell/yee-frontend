import { ApiError } from "@/lib/api/client";

export function instrumentErrorMessage(error: unknown): string {
	if (error instanceof ApiError && error.payload && typeof error.payload === "object") {
		const detail = (error.payload as Record<string, unknown>).detail;
		if (detail && typeof detail === "object") {
			const record = detail as Record<string, unknown>;
			if (record.code === "missing_scored_questions" && Array.isArray(record.question_ids)) {
				return `Restore ${record.question_ids.map(String).join(", ")}. Scored questions cannot be deleted.`;
			}
			if (typeof record.message === "string") return record.message;
		}
	}
	return error instanceof Error ? error.message : "Try again.";
}
