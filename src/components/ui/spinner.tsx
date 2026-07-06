import { cn } from "@/lib/utils";

const sizeClasses = {
	xs: "size-3.5",
	sm: "size-4",
	md: "size-6",
	lg: "size-9"
} as const;

type SpinnerProps = {
	size?: keyof typeof sizeClasses;
	/** Accessible status label (visually hidden). */
	label?: string;
	className?: string;
};

/**
 * Brand spinner — a two-part arc (faint track + solid brand-green sweep) instead
 * of a generic ring. Inherits color from `currentColor`, so it can be recolored
 * on dark surfaces via `text-*`. Honors `prefers-reduced-motion` (the global rule
 * in globals.css freezes the spin).
 */
function Spinner({ size = "md", label = "Loading", className }: SpinnerProps) {
	return (
		<span role="status" aria-live="polite" className={cn("inline-flex text-primary", className)}>
			<svg className={cn("animate-spin", sizeClasses[size])} viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
				<path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
			</svg>
			<span className="sr-only">{label}…</span>
		</span>
	);
}

export { Spinner };
export type { SpinnerProps };
