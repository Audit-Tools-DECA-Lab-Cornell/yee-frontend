import Link from "next/link";
import { Clock3 } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function WaitingApprovalPage() {
	return (
		<AuthShell
			eyebrow="Auditor Onboarding"
			title="Your account is waiting for manager approval."
			description="This page reflects the auditor flow from the notebook: signup does not immediately open the survey, and approval status has its own dedicated step.">
			<div className="space-y-6">
				<div className="flex size-14 items-center justify-center rounded-3xl bg-amber-50 text-amber-700">
					<Clock3 className="size-7" />
				</div>
				<div>
					<Badge className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 hover:bg-amber-50">Pending approval</Badge>
					<h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Waiting for access</h2>
					<p className="mt-2 text-sm leading-6 text-slate-600">
						Once a manager approves the account, the next step is profile completion and then dashboard access.
					</p>
				</div>

				<div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
					Manager approval is not wired to the backend yet, so this page currently acts as a placeholder for that state.
				</div>

				<div className="grid gap-3 sm:grid-cols-2">
					<Button asChild className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
						<Link href="/complete-profile?role=AUDITOR">Simulate approval</Link>
					</Button>
					<Button asChild variant="outline" className="rounded-2xl">
						<Link href="/login">Back to login</Link>
					</Button>
				</div>
			</div>
		</AuthShell>
	);
}
