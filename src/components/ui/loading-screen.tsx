import { BrandLogo } from "@/components/brand/brand-logo";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type LoadingScreenProps = {
	/** Status message (an ellipsis is appended automatically). */
	message?: string;
	className?: string;
};

/**
 * Full-page branded loader — a large YEE mark inside a soft pulsing brand ring
 * (one integrated visual unit), with a caption below. Replaces bare
 * "Checking access…" text on route gates and heavy first loads.
 */
function LoadingScreen({ message = "Loading", className }: LoadingScreenProps) {
	return (
		<main
			className={cn(
				"flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center",
				className
			)}
			role="status"
			aria-live="polite">
			<span className="relative inline-flex items-center justify-center">
				<span className="absolute size-24 animate-ping rounded-full bg-primary/10" aria-hidden />
				<span className="absolute size-20 rounded-full bg-primary/5" aria-hidden />
				<BrandLogo variant="mark" className="relative w-16" priority />
			</span>
			<p className="text-sm font-medium text-muted-foreground">{message}…</p>
		</main>
	);
}

type InlineLoaderProps = {
	/** Status message (an ellipsis is appended automatically). */
	message?: string;
	className?: string;
};

/**
 * Inline branded loader for use inside cards/panels — a small brand spinner with
 * a message. Replaces the plain "Loading {x}…" text blocks scattered across the
 * dashboards.
 */
function InlineLoader({ message = "Loading", className }: InlineLoaderProps) {
	return (
		<div
			className={cn("flex items-center justify-center gap-3 py-10 text-sm text-muted-foreground", className)}
			aria-live="polite">
			<Spinner size="sm" label={message} />
			<span>{message}…</span>
		</div>
	);
}

export { LoadingScreen, InlineLoader };
export type { LoadingScreenProps, InlineLoaderProps };
