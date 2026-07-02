import { Badge } from "@/components/ui/badge";
import { AuditorPlaceList } from "@/features/auditor/components/auditor-place-list";

export default function YeeIntroductionPage() {
	return (
		<main className="mx-auto max-w-5xl space-y-6 p-6">
			<header className="space-y-3">
				<Badge
					className="rounded-full px-3 py-1 hover:opacity-90"
					style={{
						background: "var(--yee-green-100)",
						color: "var(--yee-green-900)"
					}}>
					YEE introduction
				</Badge>
				<h1 className="text-3xl font-semibold tracking-tight text-foreground">Choose a place to evaluate</h1>
				<p className="max-w-3xl text-sm leading-7 text-muted-foreground">
					Select a space below to begin your Youth Enabling Environments audit. Only places assigned to your
					account are shown.
				</p>
			</header>

			<AuditorPlaceList />
		</main>
	);
}
