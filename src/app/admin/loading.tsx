import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
	return (
		<div className="flex min-h-dvh">
			{/* Sidebar skeleton */}
			<div className="hidden w-[260px] shrink-0 border-r border-slate-200 bg-white p-4 lg:flex lg:flex-col lg:gap-2">
				<Skeleton className="mb-4 h-10 w-32 rounded-xl" />
				{Array.from({ length: 8 }).map((_, i) => (
					<Skeleton key={i} className="h-9 rounded-xl" />
				))}
			</div>
			{/* Main content skeleton */}
			<div className="flex-1 space-y-6 p-6">
				<Skeleton className="h-8 w-48 rounded-xl" />
				<Skeleton className="h-4 w-96 rounded-lg" />
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-36 rounded-2xl" />
					))}
				</div>
				<Skeleton className="h-64 rounded-2xl" />
			</div>
		</div>
	);
}
