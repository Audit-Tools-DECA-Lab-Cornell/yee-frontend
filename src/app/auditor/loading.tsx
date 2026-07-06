import { Skeleton } from "@/components/ui/skeleton";

export default function AuditorDashboardLoading() {
	return (
		<div className="flex min-h-dvh">
			<div className="hidden w-[260px] shrink-0 border-r border-slate-200 bg-white p-4 lg:flex lg:flex-col lg:gap-2">
				<Skeleton className="mb-4 h-10 w-32 rounded-md" />
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-9 rounded-md" />
				))}
			</div>
			<div className="flex-1 space-y-6 p-6">
				<Skeleton className="h-8 w-48 rounded-md" />
				<Skeleton className="h-4 w-72 rounded-md" />
				<Skeleton className="h-64 rounded-md" />
				<Skeleton className="h-48 rounded-md" />
			</div>
		</div>
	);
}
