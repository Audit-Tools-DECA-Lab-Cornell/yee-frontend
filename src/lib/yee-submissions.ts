"use client";

export type MyYeeAuditRecord = {
  id: string;
  place_id: string;
  place_name: string;
  submitted_at: string;
  total_score: number;
};

/**
 * Fetches the auditor's own audit records.
 * Cookie-based auth: the HttpOnly session cookie is forwarded automatically.
 */
export async function fetchMyYeeAudits(): Promise<MyYeeAuditRecord[]> {
  const response = await fetch("/api/yee/my-audits", { cache: "no-store" });
  const text = await response.text();
  const data: unknown = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const record = data as Record<string, unknown>;
    const detail =
      typeof record.detail === "string"
        ? record.detail
        : typeof record.error === "string"
          ? record.error
          : "Request failed.";
    throw new Error(detail);
  }
  return data as MyYeeAuditRecord[];
}
