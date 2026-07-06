"use client";

import Link from "next/link";
import * as React from "react";

import { useAuth } from "@/features/auth/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
	createMyAuditorProfile,
	fetchManagerProfile,
	fetchManagers,
	removeManager,
	updateManagerProfile,
	type ManagerProfileRecord
} from "@/features/workspaces/api/live-api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/format";
import { Users2 } from "lucide-react";

function parseDisciplines(value: string): string[] {
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
	const [removeConfirmOpen, setRemoveConfirmOpen] = React.useState(false);
	const [pendingRemoveMemberId, setPendingRemoveMemberId] = React.useState<string | null>(null);

	const applyLoadedData = React.useCallback(
		(profileResult: ManagerProfileRecord, teamResult: ManagerProfileRecord[]) => {
			setError(null);
			setProfile(profileResult);
			setTeam(teamResult);
			setFullName(profileResult.full_name ?? "");
			setJobTitle(profileResult.job_title ?? "");
			setOrganization(profileResult.organization ?? "");
			setPhoneNumber(profileResult.phone_number ?? "");
			setProfessionDisciplinesText(profileResult.profession_disciplines.join(", "));
		},
		[]
	);

	const loadData = React.useCallback(async () => {
		if (!session) return;
		try {
			const [profileResult, teamResult] = await Promise.all([
				fetchManagerProfile(session),
				fetchManagers(session)
			]);
			applyLoadedData(profileResult, teamResult);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not load manager settings.");
		} finally {
			setLoading(false);
		}
	}, [applyLoadedData, session]);

	React.useEffect(() => {
		// Inline promise chain (not `void loadData()`) so every setState happens
		// in an async callback, and the fetch is cancelled on unmount.
		if (!session) return;
		let cancelled = false;
		Promise.all([fetchManagerProfile(session), fetchManagers(session)])
			.then(([profileResult, teamResult]) => {
				if (!cancelled) applyLoadedData(profileResult, teamResult);
			})
			.catch((err: unknown) => {
				if (!cancelled) setError(err instanceof Error ? err.message : "Could not load manager settings.");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [applyLoadedData, session]);

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

	function handleRemoveManager(managerId: string) {
		setPendingRemoveMemberId(managerId);
		setRemoveConfirmOpen(true);
	}

	async function doRemoveManager(managerId: string) {
		if (!session) return;
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
			<Card>
				<CardContent className="space-y-4 pt-2">
					<Skeleton className="h-5 w-48" />
					<Skeleton className="h-4 w-full max-w-md" />
					<Skeleton className="h-4 w-full max-w-sm" />
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<div className="space-y-6">
				<DashboardHero
					size="compact"
					badge="Account"
					title="Settings"
					subtitle="Manage your manager profile, auditor access, and your management team."
				/>
				{/* Manager profile card */}
				<Card>
					<CardHeader>
						<CardTitle>Manager profile</CardTitle>
						<CardDescription className="max-w-2xl">
							Your organization and profile. As a primary manager you can also rename the organization and
							invite other managers; as a secondary manager you can update your own profile.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Stat tiles */}
						<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
							{[
								{ label: "Manager type", value: profile?.manager_type ?? "Unknown" },
								{ label: "Organization", value: profile?.organization ?? "Not set" },
								{
									label: "Date joined",
									value: profile?.date_joined ? formatDate(profile.date_joined) : "Not recorded"
								},
								{
									label: "Account created",
									value: profile?.account_creation_date
										? formatDate(profile.account_creation_date)
										: "Not recorded"
								}
							].map(({ label, value }) => (
								<div key={label} className="rounded-md border border-border bg-muted/40 p-4">
									<p className="text-xs font-medium text-muted-foreground">{label}</p>
									<p className="mt-1.5 text-sm font-semibold text-foreground">{value}</p>
								</div>
							))}
						</div>

						{/* Profile edit form */}
						<form className="grid gap-4 md:grid-cols-2" onSubmit={handleSaveProfile} noValidate>
							<Field label="Full name" htmlFor="manager-full-name" required className="md:col-span-2">
								<Input
									id="manager-full-name"
									name="name"
									type="text"
									autoComplete="name"
									value={fullName}
									onChange={event => setFullName(event.target.value)}
									required
								/>
							</Field>

							<Field label="Email address" htmlFor="manager-email">
								<Input
									id="manager-email"
									name="email"
									type="email"
									autoComplete="email"
									value={profile?.email ?? session?.user.email ?? ""}
									disabled
								/>
							</Field>

							<Field label="Job title / role" htmlFor="manager-job-title" required>
								<Input
									id="manager-job-title"
									name="job-title"
									type="text"
									autoComplete="organization-title"
									value={jobTitle}
									onChange={event => setJobTitle(event.target.value)}
									required
								/>
							</Field>

							<Field
								label="Profession / discipline"
								htmlFor="manager-disciplines"
								description="Enter one or more disciplines separated by commas."
								required
								className="md:col-span-2">
								<Textarea
									id="manager-disciplines"
									name="disciplines"
									value={professionDisciplinesText}
									onChange={event => setProfessionDisciplinesText(event.target.value)}
									placeholder="Public health, education, environmental design"
									required
								/>
							</Field>

							<Field label="Organization name" htmlFor="manager-organization" required>
								<Input
									id="manager-organization"
									name="organization"
									type="text"
									autoComplete="organization"
									value={organization}
									onChange={event => setOrganization(event.target.value)}
									required
								/>
							</Field>

							<Field
								label="Phone number"
								htmlFor="manager-phone"
								required={session?.user.is_primary_manager}>
								<Input
									id="manager-phone"
									name="tel"
									type="tel"
									autoComplete="tel"
									inputMode="tel"
									value={phoneNumber}
									onChange={event => setPhoneNumber(event.target.value)}
									required={session?.user.is_primary_manager}
								/>
							</Field>

							{error ? (
								<p
									role="alert"
									aria-live="polite"
									className="md:col-span-2 rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
									{error}
								</p>
							) : null}
							{success ? (
								<p
									role="status"
									aria-live="polite"
									className="md:col-span-2 rounded-md border border-[var(--yee-green-200)] bg-[var(--yee-green-50)] px-4 py-3 text-sm text-[var(--yee-green-900)]">
									{success}
								</p>
							) : null}

							<div className="md:col-span-2 flex flex-wrap gap-3">
								<Button type="submit" isLoading={saving}>
									{saving ? "Saving..." : "Save manager profile"}
								</Button>
								<Button asChild variant="outline">
									<Link href="/manager/managers/invite">Invite manager</Link>
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>

				{/* Auditor profile card */}
				<Card>
					<CardHeader>
						<CardTitle>Manager and auditor access</CardTitle>
						<CardDescription className="max-w-2xl">
							Want to run audits yourself? Create your auditor profile once, then switch between Manager
							View and Auditor View anytime.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-md border border-border bg-muted/40 px-4 py-4 text-sm text-muted-foreground">
							Current status:{" "}
							<span className="font-medium text-foreground">
								{session?.user.has_auditor_profile
									? "Auditor profile created"
									: "No auditor profile yet"}
							</span>
						</div>
						<div className="flex flex-wrap gap-3">
							{session?.user.has_auditor_profile ? (
								<Button asChild>
									<Link href={session.user.auditor_dashboard_path ?? "/auditor"}>
										Open Auditor View
									</Link>
								</Button>
							) : (
								<Button
									type="button"
									isLoading={creatingAuditorProfile}
									onClick={handleCreateAuditorProfile}>
									{creatingAuditorProfile
										? "Creating auditor profile..."
										: "Create my auditor profile"}
								</Button>
							)}
							<Button asChild variant="outline">
								<Link href="/manager">Back to Manager View</Link>
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Management team card */}
				<Card>
					<CardHeader>
						<CardTitle>Management team</CardTitle>
						<CardDescription className="max-w-2xl">
							Primary managers can remove secondary managers from the organization. Secondary managers can
							view the team but cannot remove anyone.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{team.length === 0 ? (
							<EmptyState
								icon={Users2}
								title="No managers yet"
								description="Invite managers to join your organization from the invite page."
								action={{ label: "Invite manager", href: "/manager/managers/invite" }}
							/>
						) : (
							<div className="divide-y divide-border rounded-md border border-border">
								{team.map(member => (
									<div key={member.id} className="p-4">
										<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
											<div className="space-y-1.5">
												<p className="font-semibold text-foreground">{member.full_name}</p>
												<p className="text-sm text-muted-foreground">{member.email}</p>
												<div className="flex flex-wrap gap-1.5">
													<span className="inline-flex rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-foreground">
														{member.manager_type}
													</span>
													{member.job_title ? (
														<span className="inline-flex rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-foreground">
															{member.job_title}
														</span>
													) : null}
													<span className="inline-flex rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-foreground">
														{member.profile_completed
															? "Profile complete"
															: "Profile incomplete"}
													</span>
												</div>
												<p className="text-xs text-muted-foreground">
													{member.profession_disciplines.length > 0
														? member.profession_disciplines.join(", ")
														: "Disciplines not recorded"}
												</p>
												<p className="text-xs text-muted-foreground">
													Joined{" "}
													{member.date_joined ? formatDate(member.date_joined) : "Unknown"}
													{member.phone_number ? ` \u00B7 ${member.phone_number}` : ""}
												</p>
											</div>
											{session?.user.is_primary_manager &&
											member.manager_type !== "Primary Manager" ? (
												<Button
													type="button"
													variant="outline"
													size="sm"
													className="border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
													isLoading={removingManagerId === member.id}
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

			<ConfirmDialog
				open={removeConfirmOpen}
				onOpenChange={setRemoveConfirmOpen}
				title="Remove manager"
				description={`Remove ${team.find(m => m.id === pendingRemoveMemberId)?.full_name ?? "this manager"} from ${profile?.organization ?? "the organization"}?`}
				variant="destructive"
				confirmLabel="Remove"
				onConfirm={async () => {
					if (pendingRemoveMemberId) await doRemoveManager(pendingRemoveMemberId);
				}}
			/>
		</>
	);
}
