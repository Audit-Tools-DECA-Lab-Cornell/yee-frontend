import { Badge } from "@/components/ui/badge";
import { AuditorPlaceList } from "@/components/yee/auditor-place-list";

export default function YeeIntroductionPage() {
	return (
		<main className="mx-auto max-w-5xl space-y-6 p-6">
			<header className="space-y-3">
				<Badge className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 hover:bg-emerald-100">
					YEE introduction
				</Badge>
				<h1 className="text-3xl font-semibold tracking-tight text-slate-950">Choose a place to evaluate</h1>
				<p className="max-w-3xl text-sm leading-7 text-slate-600">
					This is the first route in the new YEE flow. In the real app, auditors should only see places
					assigned to them.
				</p>
			</header>

			<AuditorPlaceList />
		</main>
	);
}
