"use client";

import Link from "next/link";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	createMyAuditorProfile,
	fetchManagerProfile,
	fetchManagers,
	removeManager,
	updateManagerProfile,
	type ManagerProfileRecord
} from "@/lib/dashboard/live-api";

function formatDate(value?: string | null) {
	if (!value) return "Not recorded";
	return new Date(value).toLocaleDateString();
}

function parseDisciplines(value: string) {
	return value
		.split(",")
		.map(item => item.trim())
		.filter(Boolean);
}

export default function SettingsPage() {
	const { session, refreshSession } = useAuth();
	const [profile, setProfile] = React.useState<ManagerProfileRecord | null>(null);
	const [team, setTeam] = React.useState<ManagerProfileRecord[]>([]);
	const [fullName, setFullName] = React.useState("");
	const [jobTitle, setJobTitle] = React.useState("");
	const [organization, setOrganization] = React.useState("");
	const [phoneNumber, setPhoneNumber] = React.useState("");
	const [professionDisciplinesText, setProfessionDisciplinesText] = React.useState("");
	const [loading, setLoading] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [creatingAuditorProfile, setCreatingAuditorProfile] = React.useState(false);
	const [removingManagerId, setRemovingManagerId] = React.useState<string | null>(null);
	const [error, setError] = React.useState<string | null>(null);
	const [success, setSuccess] = React.useState<string | null>(null);

	const loadData = React.useCallback(async () => {
		if (!session) return;
		setLoading(true);
		setError(null);
		try {
			const [profileResult, teamResult] = await Promise.all([
				fetchManagerProfile(session),
				fetchManagers(session)
			]);
			setProfile(profileResult);
			setTeam(teamResult);
			setFullName(profileResult.full_name ?? "");
			setJobTitle(profileResult.job_title ?? "");
			setOrganization(profileResult.organization ?? "");
			setPhoneNumber(profileResult.phone_number ?? "");
			setProfessionDisciplinesText(profileResult.profession_disciplines.join(", "));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not load manager settings.");
		} finally {
			setLoading(false);
		}
	}, [session]);

	React.useEffect(() => {
		void loadData();
	}, [loadData]);

	async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!session) return;
		setSaving(true);
		setError(null);
		setSuccess(null);
		try {
			const updated = await updateManagerProfile(session, {
				full_name: fullName,
				job_title: jobTitle,
				profession_disciplines: parseDisciplines(professionDisciplinesText),
				organization,
				phone_number: phoneNumber.trim() || undefined
			});
			setProfile(updated);
			setOrganization(updated.organization ?? "");
			await refreshSession();
			await loadData();
			setSuccess("Manager profile saved.");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not save manager profile.");
		} finally {
			setSaving(false);
		}
	}

	async function handleCreateAuditorProfile() {
		if (!session) return;
		setCreatingAuditorProfile(true);
		setError(null);
		setSuccess(null);
		try {
			await createMyAuditorProfile(session);
			await refreshSession();
			setSuccess("Your auditor profile is ready. You can now switch into Auditor View.");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not create your auditor profile.");
		} finally {
			setCreatingAuditorProfile(false);
		}
	}

	async function handleRemoveManager(managerId: string) {
		if (!session) return;
		const target = team.find(member => member.id === managerId);
		const confirmed = window.confirm(
			`Remove ${target?.full_name ?? "this manager"} from ${profile?.organization ?? "the organization"}?`
		);
		if (!confirmed) return;
		setRemovingManagerId(managerId);
		setError(null);
		setSuccess(null);
		try {
			await removeManager(session, managerId);
			await loadData();
			setSuccess("Manager removed from the organization.");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not remove manager.");
		} finally {
			setRemovingManagerId(null);
		}
	}

	if (loading) {
		return (
			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardContent className="p-6 text-sm text-slate-600">Loading manager settings...</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle className="text-2xl">Manager profile</CardTitle>
					<CardDescription className="max-w-3xl leading-6">
						Every manager belongs to one organization. Primary managers can update the organization name and invite up to five additional managers. Secondary managers can update their own profile but cannot rename the organization.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
						<div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
							<p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Manager type</p>
							<p className="mt-2 text-lg font-semibold text-slate-950">{profile?.manager_type ?? "Unknown"}</p>
						</div>
						<div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
							<p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Organization</p>
							<p className="mt-2 text-lg font-semibold text-slate-950">{profile?.organization ?? "Not set"}</p>
						</div>
						<div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
							<p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Date joined</p>
							<p className="mt-2 text-lg font-semibold text-slate-950">{formatDate(profile?.date_joined)}</p>
						</div>
						<div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
							<p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Account created</p>
							<p className="mt-2 text-lg font-semibold text-slate-950">{formatDate(profile?.account_creation_date)}</p>
						</div>
					</div>

					<form className="grid gap-4 md:grid-cols-2" onSubmit={handleSaveProfile}>
						<div className="space-y-2 md:col-span-2">
							<Label htmlFor="manager-full-name">Full name</Label>
							<Input id="manager-full-name" value={fullName} onChange={event => setFullName(event.target.value)} required />
						</div>
						<div className="space-y-2">
							<Label htmlFor="manager-email">Email address</Label>
							<Input id="manager-email" value={profile?.email ?? session?.user.email ?? ""} disabled />
						</div>
						<div className="space-y-2">
							<Label htmlFor="manager-job-title">Job title / role</Label>
							<Input id="manager-job-title" value={jobTitle} onChange={event => setJobTitle(event.target.value)} required />
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label htmlFor="manager-disciplines">Profession / discipline</Label>
							<Textarea
								id="manager-disciplines"
								value={professionDisciplinesText}
								onChange={event => setProfessionDisciplinesText(event.target.value)}
								placeholder="Public health, education, environmental design"
								required
							/>
							<p className="text-xs leading-5 text-slate-500">Enter one or more disciplines separated by commas.</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="manager-organization">Organization name</Label>
							<Input id="manager-organization" value={organization} onChange={event => setOrganization(event.target.value)} required />
						</div>
						<div className="space-y-2">
							<Label htmlFor="manager-phone">
								Phone number {session?.user.is_primary_manager ? <span className="text-rose-600">*</span> : <span className="text-slate-400">(optional)</span>}
							</Label>
							<Input id="manager-phone" value={phoneNumber} onChange={event => setPhoneNumber(event.target.value)} required={session?.user.is_primary_manager} />
						</div>

						{error ? <p className="md:col-span-2 text-sm text-rose-600">{error}</p> : null}
						{success ? <p className="md:col-span-2 text-sm text-emerald-700">{success}</p> : null}

						<div className="md:col-span-2 flex flex-wrap gap-3">
							<Button type="submit" className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]" disabled={saving}>
								{saving ? "Saving..." : "Save manager profile"}
							</Button>
							<Button asChild variant="outline" className="rounded-2xl">
								<Link href="/dashboard/managers/invite">Invite manager</Link>
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle className="text-2xl">Manager and auditor access</CardTitle>
					<CardDescription className="max-w-3xl leading-6">
						Managers can also act as auditors inside the same organization. Create your auditor profile once, then switch between Manager View and Auditor View.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
						<p>
							Current status:{" "}
							<span className="font-medium text-slate-950">
								{session?.user.has_auditor_profile ? "Auditor profile created" : "No auditor profile yet"}
							</span>
						</p>
					</div>
					<div className="flex flex-wrap gap-3">
						{session?.user.has_auditor_profile ? (
							<Button asChild className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
								<Link href={session.user.auditor_dashboard_path ?? "/my-dashboard"}>Open Auditor View</Link>
							</Button>
						) : (
							<Button
								type="button"
								className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]"
								disabled={creatingAuditorProfile}
								onClick={handleCreateAuditorProfile}>
								{creatingAuditorProfile ? "Creating auditor profile..." : "Create my auditor profile"}
							</Button>
						)}
						<Button asChild variant="outline" className="rounded-2xl">
							<Link href="/dashboard">Back to Manager View</Link>
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle className="text-2xl">Management team</CardTitle>
					<CardDescription className="max-w-3xl leading-6">
						Primary managers can remove secondary managers from the organization. Secondary managers can view the team but cannot remove anyone.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{team.length === 0 ? (
						<p className="text-sm text-slate-600">No managers recorded for this organization yet.</p>
					) : (
						<div className="space-y-4">
							{team.map(member => (
								<div key={member.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
									<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
										<div className="space-y-2">
											<p className="text-lg font-semibold text-slate-950">{member.full_name}</p>
											<p className="text-sm text-slate-600">{member.email}</p>
											<div className="flex flex-wrap gap-2 text-xs text-slate-500">
												<span className="rounded-full bg-white px-3 py-1">{member.manager_type}</span>
												<span className="rounded-full bg-white px-3 py-1">{member.job_title || "Job title not set"}</span>
												<span className="rounded-full bg-white px-3 py-1">{member.profile_completed ? "Profile complete" : "Profile incomplete"}</span>
											</div>
											<p className="text-sm leading-6 text-slate-600">
												Disciplines: {member.profession_disciplines.length > 0 ? member.profession_disciplines.join(", ") : "Not recorded"}
											</p>
											<p className="text-sm leading-6 text-slate-600">
												Joined {formatDate(member.date_joined)}{member.phone_number ? ` • ${member.phone_number}` : ""}
											</p>
										</div>
										{session?.user.is_primary_manager && member.manager_type !== "Primary Manager" ? (
											<Button
												type="button"
												variant="outline"
												className="rounded-2xl border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
												disabled={removingManagerId === member.id}
												onClick={() => handleRemoveManager(member.id)}>
												{removingManagerId === member.id ? "Removing..." : "Remove manager"}
											</Button>
										) : null}
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
