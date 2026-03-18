import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
	return (
		<AuthShell
			eyebrow="New Account"
			title="Create an account before joining projects or fieldwork."
			description="Signup now reflects the real app idea from your notes: managers and auditors share one frontend, but their path after signup depends on approval and profile state.">
			<div className="space-y-6">
				<div>
					<Badge className="rounded-full bg-sky-50 px-3 py-1 text-sky-700 hover:bg-sky-50">Shared frontend repo</Badge>
					<h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Sign up</h2>
					<p className="mt-2 text-sm leading-6 text-slate-600">
						This is a product-level entry page now, not a survey screen. Real backend hookup can replace this form later.
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor="name">Full name</Label>
						<Input id="name" placeholder="Andisha Safdariyan" />
					</div>
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor="signup-email">Email</Label>
						<Input id="signup-email" type="email" placeholder="name@university.edu" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input id="password" type="password" placeholder="Create a password" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="role">Account type</Label>
						<select
							id="role"
							defaultValue="AUDITOR"
							className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none">
							<option value="AUDITOR">Auditor</option>
							<option value="MANAGER">Manager</option>
							<option value="ADMIN">Admin</option>
						</select>
					</div>
				</div>

				<div className="grid gap-3 sm:grid-cols-2">
					<Button asChild className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
						<Link href="/waiting-approval">Continue as auditor demo</Link>
					</Button>
					<Button asChild variant="outline" className="rounded-2xl">
						<Link href="/complete-profile?role=MANAGER">Continue as manager demo</Link>
					</Button>
				</div>

				<p className="text-sm text-slate-600">
					Already have an account?{" "}
					<Link href="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
						Log in
					</Link>
				</p>
			</div>
		</AuthShell>
	);
}
