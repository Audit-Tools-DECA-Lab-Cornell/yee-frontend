"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/features/auth/components/auth-provider";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getRouteForUser } from "@/features/auth/session";

/**
 * Known profession/discipline options for the multi-select tag UI.
 * Auditors can type custom values via the freeform textarea fallback.
 */
const DISCIPLINE_OPTIONS = [
	"Public health",
	"Environmental design",
	"Urban planning",
	"Education",
	"Recreation",
	"Social work",
	"Kinesiology",
	"Psychology",
	"Community development"
] as const;

export default function CompleteProfilePage() {
	const router = useRouter();
	const { session, loading, completeProfile } = useAuth();

	const [fullName, setFullName] = React.useState("");
	const [jobTitle, setJobTitle] = React.useState("");
	const [organization, setOrganization] = React.useState("");
	const [phoneNumber, setPhoneNumber] = React.useState("");
	/** Selected discipline tags. */
	const [selectedDisciplines, setSelectedDisciplines] = React.useState<string[]>([]);
	/** Custom/freeform discipline entries typed by user. */
	const [customDisciplineText, setCustomDisciplineText] = React.useState("");
	const [submitting, setSubmitting] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	const isPrimaryManager = session?.user.is_primary_manager ?? false;

	// Prefill the form from the session during render (not in an effect) so it
	// happens before paint without a cascading re-render.
	const [prefilledForEmail, setPrefilledForEmail] = React.useState<string | null>(null);
	if (session && prefilledForEmail !== session.user.email) {
		setPrefilledForEmail(session.user.email);
		setFullName(session.user.name ?? "");
		setOrganization(session.user.organization ?? "");
	}

	React.useEffect(() => {
		if (loading) return;
		if (!session) {
			router.replace("/login");
			return;
		}
		if (session.user.next_step !== "COMPLETE_PROFILE") {
			router.replace(getRouteForUser(session.user));
		}
	}, [loading, router, session]);

	function toggleDiscipline(discipline: string) {
		setSelectedDisciplines(prev =>
			prev.includes(discipline) ? prev.filter(d => d !== discipline) : [...prev, discipline]
		);
	}

	function buildDisciplinesList(): string[] {
		const custom = customDisciplineText
			.split(",")
			.map(item => item.trim())
			.filter(Boolean);
		return [...new Set([...selectedDisciplines, ...custom])];
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitting(true);
		setError(null);

		const disciplines = buildDisciplinesList();
		if (disciplines.length === 0) {
			setError("Please select or enter at least one discipline.");
			setSubmitting(false);
			return;
		}

		try {
			const nextSession = await completeProfile({
				full_name: fullName,
				job_title: jobTitle,
				profession_disciplines: disciplines,
				organization,
				phone_number: phoneNumber.trim() || undefined
			});
			router.replace(getRouteForUser(nextSession.user));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not complete profile. Please try again.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<AuthShell>
			<div className="space-y-6">
				<div className="space-y-1.5">
					<h2 className="text-2xl font-semibold tracking-tight text-foreground">Complete your profile</h2>
					<p className="text-sm text-muted-foreground leading-relaxed">
						This information helps your team collaborate. All fields are required unless marked optional.
					</p>
				</div>

				<form className="space-y-4" onSubmit={handleSubmit} noValidate>
					<Field label="Full name" htmlFor="full-name" required>
						<Input
							id="full-name"
							name="name"
							type="text"
							autoComplete="name"
							placeholder="Andisha Safdariyan"
							value={fullName}
							onChange={event => setFullName(event.target.value)}
							required
						/>
					</Field>

					<Field label="Job title or role" htmlFor="job-title" required>
						<Input
							id="job-title"
							name="job-title"
							type="text"
							autoComplete="organization-title"
							placeholder="Research coordinator, project lead..."
							value={jobTitle}
							onChange={event => setJobTitle(event.target.value)}
							required
						/>
					</Field>

					<Field label="Organization" htmlFor="organization" required>
						<Input
							id="organization"
							name="organization"
							type="text"
							autoComplete="organization"
							placeholder="Youth Enabling Environments Collaborative"
							value={organization}
							onChange={event => setOrganization(event.target.value)}
							required
						/>
					</Field>

					{/* Discipline multi-select with tag UI */}
					<fieldset className="space-y-3">
						<legend className="text-sm font-medium leading-none">
							Profession / discipline
							<span className="ml-0.5 text-destructive" aria-hidden="true">
								*
							</span>
						</legend>
						<p className="text-xs text-muted-foreground">
							Select one or more, or type additional disciplines in the field below.
						</p>
						<div className="flex flex-wrap gap-2" role="group" aria-label="Profession disciplines">
							{DISCIPLINE_OPTIONS.map(discipline => {
								const isSelected = selectedDisciplines.includes(discipline);
								return (
									<label key={discipline} className="inline-flex cursor-pointer items-center">
										<input
											type="checkbox"
											className="sr-only"
											checked={isSelected}
											onChange={() => toggleDiscipline(discipline)}
										/>
										<span
											aria-pressed={isSelected}
											className={[
												"inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
												isSelected
													? "border-[var(--yee-green-600)] bg-[var(--yee-green-100)] text-[var(--yee-green-900)]"
													: "border-border bg-background text-foreground hover:bg-muted"
											].join(" ")}>
											{discipline}
										</span>
									</label>
								);
							})}
						</div>
						<Textarea
							id="custom-disciplines"
							name="custom-disciplines"
							placeholder="Other disciplines, comma-separated..."
							value={customDisciplineText}
							onChange={event => setCustomDisciplineText(event.target.value)}
							rows={2}
							aria-label="Additional disciplines (comma-separated)"
						/>
					</fieldset>

					<Field
						label="Phone number"
						htmlFor="phone-number"
						required={isPrimaryManager}
						description={
							isPrimaryManager
								? "Required for primary managers as the organization contact."
								: "Optional. Helps coordinators reach you during field work."
						}>
						<Input
							id="phone-number"
							name="tel"
							type="tel"
							autoComplete="tel"
							inputMode="tel"
							placeholder="(555) 555-5555"
							value={phoneNumber}
							onChange={event => setPhoneNumber(event.target.value)}
							required={isPrimaryManager}
						/>
					</Field>

					{error ? (
						<p
							role="alert"
							aria-live="polite"
							className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
							{error}
						</p>
					) : null}

					<div className="flex gap-3">
						<Button type="submit" className="flex-1" isLoading={submitting}>
							{submitting ? "Saving..." : "Save and continue"}
						</Button>
						<Button asChild variant="outline">
							<Link href="/login">Back to sign in</Link>
						</Button>
					</div>
				</form>
			</div>
		</AuthShell>
	);
}
