"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { AuthShell } from "@/components/auth/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getRouteForUser } from "@/lib/auth/session";

export default function CompleteProfilePage() {
	const router = useRouter();
	const { session, loading, completeProfile } = useAuth();
	const [fullName, setFullName] = React.useState("");
	const [jobTitle, setJobTitle] = React.useState("");
	const [organization, setOrganization] = React.useState("");
	const [phoneNumber, setPhoneNumber] = React.useState("");
	const [professionDisciplinesText, setProfessionDisciplinesText] = React.useState("");
	const [submitting, setSubmitting] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (loading) return;
		if (!session) {
			router.replace("/login");
			return;
		}
		setFullName(session.user.name ?? "");
		setOrganization(session.user.organization ?? "");
		if (session.user.next_step !== "COMPLETE_PROFILE") {
			router.replace(getRouteForUser(session.user));
		}
	}, [loading, router, session]);

	function parseDisciplines(value: string) {
		return value
			.split(",")
			.map(item => item.trim())
			.filter(Boolean);
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitting(true);
		setError(null);

		try {
			const nextSession = await completeProfile({
				full_name: fullName,
				job_title: jobTitle,
				profession_disciplines: parseDisciplines(professionDisciplinesText),
				organization,
				phone_number: phoneNumber.trim() || undefined
			});
			router.replace(getRouteForUser(nextSession.user));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not complete profile.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<AuthShell
			eyebrow="Profile Setup"
			title="Complete profile details before entering the dashboard."
			description="This step is now connected to backend onboarding state so profile completion changes the next route for the signed-in user.">
			<div className="space-y-6">
				<div>
					<Badge className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-50">
						Profile completion
					</Badge>
					<h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Complete your profile</h2>
					<p className="mt-2 text-sm leading-6 text-slate-600">
						Primary and secondary managers both need a complete manager profile before entering the dashboard. Primary managers must also provide a phone number.
					</p>
				</div>

				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="full-name">Full name</Label>
						<Input
							id="full-name"
							placeholder="Andisha Safdariyan"
							value={fullName}
							onChange={event => setFullName(event.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="job-title">Job title / role</Label>
						<Input
							id="job-title"
							placeholder="Project lead, researcher, coordinator..."
							value={jobTitle}
							onChange={event => setJobTitle(event.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="profession-disciplines">Profession / discipline</Label>
						<Textarea
							id="profession-disciplines"
							placeholder="Public health, environmental design, education"
							value={professionDisciplinesText}
							onChange={event => setProfessionDisciplinesText(event.target.value)}
							required
						/>
						<p className="text-xs leading-5 text-slate-500">Enter one or more disciplines separated by commas.</p>
					</div>
					<div className="space-y-2">
						<Label htmlFor="organization">Organization</Label>
						<Input
							id="organization"
							placeholder="Youth Enabling Environments Collaborative"
							value={organization}
							onChange={event => setOrganization(event.target.value)}
							required
						/>
						<p className="text-xs leading-5 text-slate-500">
							Secondary managers must keep this aligned with the organization they were invited into.
						</p>
					</div>
					<div className="space-y-2">
						<Label htmlFor="phone-number">
							Phone number {session?.user.is_primary_manager ? <span className="text-rose-600">*</span> : <span className="text-slate-400">(optional)</span>}
						</Label>
						<Input
							id="phone-number"
							placeholder="(555) 555-5555"
							value={phoneNumber}
							onChange={event => setPhoneNumber(event.target.value)}
							required={session?.user.is_primary_manager}
						/>
					</div>
					{error ? <p className="text-sm text-rose-600">{error}</p> : null}
					<div className="grid gap-3 sm:grid-cols-2">
						<Button type="submit" className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]" disabled={submitting}>
							{submitting ? "Saving..." : "Save and continue"}
						</Button>
						<Button asChild variant="outline" className="rounded-2xl">
							<Link href="/login">Back to login</Link>
						</Button>
					</div>
				</form>
			</div>
		</AuthShell>
	);
}
