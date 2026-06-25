/** Returns the backend API base URL, stripped of trailing slashes. */
export function getApiBaseUrl(): string {
  const url = process.env["BACKEND_API_URL"] ?? process.env["API_BASE_URL"] ?? process.env["NEXT_PUBLIC_API_BASE_URL"];
  if (!url) {
    // Development fallback — production MUST have BACKEND_API_URL set.
    return "http://127.0.0.1:8000";
  }
  return url.replace(/\/$/, "");
}
