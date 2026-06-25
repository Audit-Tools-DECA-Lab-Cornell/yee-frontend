"use client";

import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	createSiteCopyVersion,
	fetchSiteCopyVersions,
	updateSiteCopyStatus,
	type SiteCopyVersionRecord
} from "@/lib/dashboard/live-api";
import {
	buildWorkspaceConfigs,
	defaultWorkspaceConfigs,
	type SiteCopyPayload,
	type WorkspaceVariant
} from "@/lib/dashboard/workspace-config";

const variants: WorkspaceVariant[] = ["admin", "manager", "auditor"];

function buildDefaultSiteCopy(): SiteCopyPayload {
	return {
		workspaceConfigs: Object.fromEntries(
			variants.map(variant => {
				const config = defaultWorkspaceConfigs[variant];
				return [
					variant,
					{
						description: config.description,
						searchPlaceholder: config.searchPlaceholder,
						primaryAction: {
							label: config.primaryAction.label
						},
						sidebarCard: {
							eyebrow: config.sidebarCard.eyebrow,
							title: config.sidebarCard.title,
							description: config.sidebarCard.description,
							actionLabel: config.sidebarCard.actionLabel
						},
						pageCopy: Object.fromEntries(
							Object.entries(config.pageCopy).map(([path, content]) => [
								path,
								{
									title: content.title,
									description: content.description
								}
							])
						)
					}
				];
			})
		) as SiteCopyPayload["workspaceConfigs"]
	};
}

export function SiteCopyAdminPanel() {
	const { session } = useAuth();
	const [versions, setVersions] = React.useState<SiteCopyVersionRecord[]>([]);
	const [draft, setDraft] = React.useState<SiteCopyPayload>(buildDefaultSiteCopy());
	const [versionLabel, setVersionLabel] = React.useState("site-copy-v1");
	const [activateOnCreate, setActivateOnCreate] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [loading, setLoading] = React.useState(true);
	const [selectedVersionId, setSelectedVersionId] = React.useState<string | null>(null);
	const [error, setError] = React.useState<string | null>(null);
	const [success, setSuccess] = React.useState<string | null>(null);

	const selectedVersion = versions.find(version => version.id === selectedVersionId) ?? null;
	const previewConfigs = buildWorkspaceConfigs((selectedVersion?.content as SiteCopyPayload | undefined) ?? draft);

	const loadAll = React.useCallback(async () => {
		if (!session) return;
		setLoading(true);
		setError(null);
		try {
			const rows = await fetchSiteCopyVersions(session);
			setVersions(rows);
			const active = rows.find(row => row.is_active) ?? rows[0] ?? null;
			setSelectedVersionId(active?.id ?? null);
			if (active?.content) {
				setDraft(active.content as SiteCopyPayload);
				setVersionLabel(`${active.instrument_version}-copy`);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not load site copy versions.");
		} finally {
			setLoading(false);
		}
	}, [session]);

	React.useEffect(() => {
		void loadAll();
	}, [loadAll]);

	if (!session) return null;

	function updateVariantField(
		variant: WorkspaceVariant,
		field: keyof NonNullable<NonNullable<SiteCopyPayload["workspaceConfigs"]>[WorkspaceVariant]>,
		value: unknown
	) {
		setDraft(current => ({
			workspaceConfigs: {
				...current.workspaceConfigs,
				[variant]: {
					...(current.workspaceConfigs?.[variant] ?? {}),
					[field]: value
				}
			}
		}));
	}

	function updatePageCopy(variant: WorkspaceVariant, path: string, key: "title" | "description", value: string) {
		setDraft(current => ({
			workspaceConfigs: {
				...current.workspaceConfigs,
				[variant]: {
					...(current.workspaceConfigs?.[variant] ?? {}),
					pageCopy: {
						...(current.workspaceConfigs?.[variant]?.pageCopy ?? {}),
						[path]: {
							...(current.workspaceConfigs?.[variant]?.pageCopy?.[path] ?? {}),
							[key]: value
						}
					}
				}
			}
		}));
	}

	async function handleCreate() {
		if (!session) return;
		setSaving(true);
		setError(null);
		setSuccess(null);
		try {
			const created = await createSiteCopyVersion(
				session,
				{
					instrument_version: versionLabel.trim(),
					content: draft as Record<string, unknown>
				},
				activateOnCreate
			);
			setSuccess(`Saved website copy version ${created.instrument_version}.`);
			await loadAll();
			setSelectedVersionId(created.id);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not save website copy.");
		} finally {
			setSaving(false);
		}
	}

	async function handleActivate(copyId: string) {
		if (!session) return;
		setSaving(true);
		setError(null);
		setSuccess(null);
		try {
			const updated = await updateSiteCopyStatus(session, copyId, { is_active: true });
			setSuccess(`Activated website copy version ${updated.instrument_version}.`);
			await loadAll();
			setSelectedVersionId(updated.id);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not activate website copy.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="space-y-6">
			<Card className="rounded-lg border-sky-200/70 bg-sky-50/70 shadow-sm">
				<CardHeader>
					<CardTitle>Website copy editor</CardTitle>
					<CardDescription className="text-slate-700">
						Use this page to update dashboard wording across the admin, manager, and auditor website without
						editing code or JSON.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
					<div className="rounded-lg border border-sky-200 bg-white/80 p-4">
						<p className="font-medium text-slate-900">Dashboard text only</p>
						<p className="mt-1">
							This page changes website copy like headings, sidebar text, and page descriptions.
						</p>
					</div>
					<div className="rounded-lg border border-sky-200 bg-white/80 p-4">
						<p className="font-medium text-slate-900">Survey wording stays separate</p>
						<p className="mt-1">
							Survey questions and section instructions are still managed from the Instruments page.
						</p>
					</div>
					<div className="rounded-lg border border-sky-200 bg-white/80 p-4">
						<p className="font-medium text-slate-900">Version and activate</p>
						<p className="mt-1">Save a new website copy version, then make it live when you are ready.</p>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
				<Card className="rounded-lg border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Website copy versions</CardTitle>
						<CardDescription>
							Activate the website text version that should be used across the dashboard.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{loading ? (
							<p className="text-sm text-slate-500">Loading website copy versions...</p>
						) : versions.length === 0 ? (
							<p className="text-sm text-slate-500">
								No saved website copy versions yet. The editor on the right starts from the current
								built-in dashboard text.
							</p>
						) : (
							versions.map(version => (
								<div key={version.id} className="rounded-lg border border-slate-200 bg-white p-4">
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="font-medium text-slate-900">{version.instrument_version}</p>
											<p className="mt-1 text-xs text-slate-500">
												Created {new Date(version.created_at).toLocaleString()}
											</p>
										</div>
										<div className="flex flex-wrap gap-2">
											{version.is_active ? (
												<Badge className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
													Active
												</Badge>
											) : null}
											<Button
												type="button"
												variant="outline"
												className="rounded-lg"
												onClick={() => {
													setSelectedVersionId(version.id);
													setDraft(version.content as SiteCopyPayload);
													setVersionLabel(`${version.instrument_version}-copy`);
												}}>
												Load
											</Button>
											{!version.is_active ? (
												<Button
													type="button"
													className="rounded-lg bg-[#10231f] text-white hover:bg-[#17302c]"
													onClick={() => void handleActivate(version.id)}
													disabled={saving}>
													Activate
												</Button>
											) : null}
										</div>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>

				<Card className="rounded-lg border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Edit website text</CardTitle>
						<CardDescription>
							These fields control dashboard wording visible to admins, managers, and auditors on the
							website.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-5">
						<div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
							<div className="space-y-2">
								<Label htmlFor="site-copy-version">Version Label</Label>
								<Input
									id="site-copy-version"
									value={versionLabel}
									onChange={event => setVersionLabel(event.target.value)}
									placeholder="Example: manager-copy-review-1"
								/>
							</div>
							<div className="flex items-end">
								<label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
									<input
										type="checkbox"
										checked={activateOnCreate}
										onChange={event => setActivateOnCreate(event.target.checked)}
										className="h-4 w-4 rounded border-slate-300"
									/>
									Activate when saved
								</label>
							</div>
						</div>

						{variants.map(variant => {
							const config = previewConfigs[variant];
							const original = defaultWorkspaceConfigs[variant];
							return (
								<div
									key={variant}
									className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
									<div>
										<h3 className="text-base font-semibold capitalize text-slate-900">
											{variant} dashboard
										</h3>
										<p className="mt-1 text-sm text-slate-600">{original.title}</p>
									</div>
									<div className="space-y-2">
										<Label>Workspace description</Label>
										<Textarea
											value={config.description}
											onChange={event =>
												updateVariantField(variant, "description", event.target.value)
											}
											className="min-h-[5rem]"
										/>
									</div>
									<div className="space-y-2">
										<Label>Search placeholder</Label>
										<Input
											value={config.searchPlaceholder}
											onChange={event =>
												updateVariantField(variant, "searchPlaceholder", event.target.value)
											}
										/>
									</div>
									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-2">
											<Label>Top button label</Label>
											<Input
												value={config.primaryAction.label}
												onChange={event =>
													updateVariantField(variant, "primaryAction", {
														label: event.target.value
													})
												}
											/>
										</div>
										<div className="space-y-2">
											<Label>Sidebar action button label</Label>
											<Input
												value={config.sidebarCard.actionLabel}
												onChange={event =>
													updateVariantField(variant, "sidebarCard", {
														...(draft.workspaceConfigs?.[variant]?.sidebarCard ?? {}),
														actionLabel: event.target.value
													})
												}
											/>
										</div>
									</div>
									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-2">
											<Label>Sidebar small label</Label>
											<Input
												value={config.sidebarCard.eyebrow}
												onChange={event =>
													updateVariantField(variant, "sidebarCard", {
														...(draft.workspaceConfigs?.[variant]?.sidebarCard ?? {}),
														eyebrow: event.target.value
													})
												}
											/>
										</div>
										<div className="space-y-2">
											<Label>Sidebar card title</Label>
											<Input
												value={config.sidebarCard.title}
												onChange={event =>
													updateVariantField(variant, "sidebarCard", {
														...(draft.workspaceConfigs?.[variant]?.sidebarCard ?? {}),
														title: event.target.value
													})
												}
											/>
										</div>
									</div>
									<div className="space-y-2">
										<Label>Sidebar card description</Label>
										<Textarea
											value={config.sidebarCard.description}
											onChange={event =>
												updateVariantField(variant, "sidebarCard", {
													...(draft.workspaceConfigs?.[variant]?.sidebarCard ?? {}),
													description: event.target.value
												})
											}
											className="min-h-[5rem]"
										/>
									</div>
									<div className="space-y-3">
										<p className="text-sm font-medium text-slate-900">
											Page headings and descriptions
										</p>
										{Object.entries(config.pageCopy).map(([path, content]) => (
											<div
												key={path}
												className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
												<p className="text-xs font-medium uppercase tracking-wide text-slate-500">
													{path}
												</p>
												<Input
													value={content.title}
													onChange={event =>
														updatePageCopy(variant, path, "title", event.target.value)
													}
												/>
												<Textarea
													value={content.description}
													onChange={event =>
														updatePageCopy(variant, path, "description", event.target.value)
													}
													className="min-h-[4.5rem]"
												/>
											</div>
										))}
									</div>
								</div>
							);
						})}

						<div className="flex flex-wrap items-center gap-3">
							<Button
								type="button"
								className="rounded-lg bg-[#10231f] text-white hover:bg-[#17302c]"
								onClick={() => void handleCreate()}
								disabled={saving || !versionLabel.trim()}>
								{saving ? "Saving..." : "Save Website Copy Version"}
							</Button>
							{success ? <p className="text-sm text-emerald-700">{success}</p> : null}
							{error ? <p className="text-sm text-rose-700">{error}</p> : null}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
