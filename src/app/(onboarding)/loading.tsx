import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
	return (
		<div className="flex min-h-dvh items-center justify-center p-6">
			<div className="w-full max-w-md space-y-4">
				<Skeleton className="mx-auto h-10 w-32 rounded-lg" />
				<Skeleton className="h-8 w-64 rounded-lg" />
				<Skeleton className="h-4 w-80 rounded-md" />
				<Skeleton className="h-64 rounded-lg" />
			</div>
		</div>
	);
}
