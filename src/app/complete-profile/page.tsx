import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function CompleteProfilePage({
	searchParams
}: {
	searchParams: Promise<{ role?: string }>;
}) {
	const { role } = await searchParams;
	const nextHref = role === "AUDITOR" ? "/my-dashboard" : role === "ADMIN" ? "/admin" : "/dashboard";

	return (
		<AuthShell
			eyebrow="Profile Setup"
			title="Complete profile details before entering the dashboard."
			description="This step separates onboarding from login and from the audit form, which keeps the user flow aligned with the product sketches.">
			<div className="space-y-6">
				<div>
					<Badge className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-50">
						Profile completion
					</Badge>
					<h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Complete your profile</h2>
					<p className="mt-2 text-sm leading-6 text-slate-600">
						Add the remaining setup details now. In the real app these fields will come from backend-supported onboarding.
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="organization">Organization</Label>
						<Input id="organization" placeholder="DECA Lab" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="title">Role title</Label>
						<Input id="title" placeholder="Research Assistant" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="phone">Phone</Label>
						<Input id="phone" placeholder="(555) 555-5555" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="location">Primary region</Label>
						<Input id="location" placeholder="New York City" />
					</div>
				</div>

				<div className="grid gap-3 sm:grid-cols-2">
					<Button asChild className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
						<Link href={nextHref}>Save and continue</Link>
					</Button>
					<Button asChild variant="outline" className="rounded-2xl">
						<Link href="/login">Back to login</Link>
					</Button>
				</div>
			</div>
		</AuthShell>
	);
}
