/**
 * The single place an auditor identity enters any export. Every builder (CSV,
 * PDF, XLSX) routes the auditor field through here, so the privacy invariant is
 * enforced in exactly one function: exports show the `AUD###` generated ID, or a
 * redaction placeholder when it is absent — never the raw auditor identifier
 * (logistics §3; plan acceptance criteria 4–5).
 */
import { REDACTED_AUDITOR_ID } from "./types";

export function resolveAuditorId(generatedId: string | null | undefined): string {
	const trimmed = (generatedId ?? "").trim();
	return trimmed.length > 0 ? trimmed : REDACTED_AUDITOR_ID;
}
