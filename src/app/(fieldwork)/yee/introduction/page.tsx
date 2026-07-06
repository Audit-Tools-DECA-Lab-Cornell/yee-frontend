import { AuditorPlaceList } from "@/features/auditor/components/auditor-place-list";

export default function YeeIntroductionPage() {
	return (
		<main className="mx-auto max-w-5xl p-6">
			<AuditorPlaceList
				title="Choose a place to evaluate"
				subtitle="Select a space below to begin your Youth Enabling Environments audit. Only places assigned to your account are shown."
			/>
		</main>
	);
}
