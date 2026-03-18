import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMockRedirect, mockUserStates } from "@/lib/auth/mock-auth";

export default function LoginPage() {
	return (
		<AuthShell
			eyebrow="Audit Tools Platform"
			title="Log in before entering the YEE workspace."
			description="The homepage now starts with authentication flow, and the survey is available only as one part of the product after routing through dashboard pages.">
			<div className="space-y-6">
				<div>
					<Badge className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-50">
						Step 1 of product flow
					</Badge>
					<h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Log in</h2>
					<p className="mt-2 text-sm leading-6 text-slate-600">
						These are mocked entry points for now so we can wire routing before backend auth is finalized.
					</p>
				</div>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input id="email" type="email" placeholder="name@university.edu" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input id="password" type="password" placeholder="••••••••" />
					</div>
				</div>

				<div className="space-y-3">
					<p className="text-sm font-medium text-slate-700">Mock login states</p>
					<div className="grid gap-3">
						{mockUserStates.map(state => (
							<Button
								key={state.label}
								asChild
								variant="outline"
								className="h-auto justify-between rounded-2xl border-slate-200 px-4 py-4 text-left">
								<Link href={getMockRedirect(state)}>
									<span>
										<span className="block text-sm font-semibold text-slate-900">{state.label}</span>
										<span className="mt-1 block text-sm leading-6 text-slate-500">{state.description}</span>
									</span>
									<Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100">
										{state.role}
									</Badge>
								</Link>
							</Button>
						))}
					</div>
				</div>

				<p className="text-sm text-slate-600">
					Need an account?{" "}
					<Link href="/signup" className="font-medium text-emerald-700 hover:text-emerald-800">
						Create one here
					</Link>
				</p>
			</div>
		</AuthShell>
	);
}
