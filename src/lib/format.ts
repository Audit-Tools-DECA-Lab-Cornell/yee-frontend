/**
 * Shared formatting utilities using Intl APIs for consistent
 * date, number, and score display across the platform.
 *
 * All functions accept raw values from the API and return
 * user-facing strings ready for display.
 */

/** Format an ISO date string (or Date) into a short human-readable date. */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

/** Format an ISO date string with both date and time. */
export function formatDateTime(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

/** Format a score as "value / max" with tabular-nums styling assumption. */
export function formatScore(value: number, max: number): string {
  return `${value} / ${max}`;
}

/**
 * Format a decimal ratio (0–1) or raw percentage (0–100) as a percentage string.
 * Pass the value as-is from the API; specify `isRatio` if it's already 0–1.
 */
export function formatPercent(value: number, isRatio = false): string {
  const ratio = isRatio ? value : value / 100;
  return new Intl.NumberFormat("en-CA", {
    style: "percent",
    maximumFractionDigits: 1
  }).format(ratio);
}

/** Format a number with thousands separators. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-CA").format(value);
}

/** Format a duration in minutes into a human-readable string. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}min` : `${hours}h`;
}

/**
 * Format an ISO date string as a relative time description (e.g. "2 days ago").
 * Falls back to `formatDate` for dates more than 30 days old.
 */
export function formatRelativeDate(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? "just now" : `${diffMinutes} minutes ago`;
    }
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  return formatDate(date);
}
