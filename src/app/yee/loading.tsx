import { Skeleton } from "@/components/ui/skeleton";

export default function YeeLoading() {
	return (
		<main className="mx-auto max-w-5xl space-y-6 p-6">
			<Skeleton className="h-10 w-48 rounded-2xl" />
			<Skeleton className="h-4 w-64 rounded-lg" />
			<Skeleton className="h-[600px] rounded-2xl" />
		</main>
	);
}
