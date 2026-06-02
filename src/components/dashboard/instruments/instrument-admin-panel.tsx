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
	createInstrumentVersion,
	fetchInstrumentVersions,
	updateInstrumentStatus,
	type InstrumentVersionRecord
} from "@/lib/dashboard/live-api";

type EditableSection = {
	block: string;
	title?: string;
	intro_text?: string;
	comment_prompt?: string;
};

type EditableItem = {
	item_id: string;
	block?: string;
	block_title?: string;
	question_text?: string;
};

function summarizeInstrument(content: Record<string, unknown> | null) {
	if (!content) {
		return {
			name: "Unavailable",
			key: "yee",
			version: "Unknown",
			sections: 0,
			items: 0
		};
	}

	return {
		name:
			typeof content.survey_name === "string"
				? content.survey_name
				: typeof content.instrument_name === "string"
					? content.instrument_name
					: "YEE Instrument",
		key: typeof content.instrument_key === "string" ? content.instrument_key : "yee",
		version:
			typeof content.version === "string"
				? content.version
				: typeof content.instrument_version === "string"
					? content.instrument_version
					: "Unknown",
		sections: Array.isArray(content.sections) ? content.sections.length : 0,
		items: Array.isArray(content.scoring_items) ? content.scoring_items.length : 0
	};
}

async function fetchCanonicalInstrument() {
	const response = await fetch("/api/yee/instrument", { cache: "no-store" });
	const text = await response.text();
	const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
	if (!response.ok) {
		const detail =
			typeof data.detail === "string"
				? data.detail
				: typeof data.error === "string"
					? data.error
					: "Could not load the current YEE instrument.";
		throw new Error(detail);
	}
	return data;
}

export function InstrumentAdminPanel() {
	const { session } = useAuth();
	const [versions, setVersions] = React.useState<InstrumentVersionRecord[]>([]);
	const [canonicalInstrument, setCanonicalInstrument] = React.useState<Record<string, unknown> | null>(null);
	const [selectedVersionId, setSelectedVersionId] = React.useState<string | null>(null);
	const [instrumentKey, setInstrumentKey] = React.useState("yee");
	const [instrumentVersion, setInstrumentVersion] = React.useState("1");
	const [editorValue, setEditorValue] = React.useState("");
	const [activateOnCreate, setActivateOnCreate] = React.useState(true);
	const [showAdvancedEditor, setShowAdvancedEditor] = React.useState(false);
	const [loading, setLoading] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [success, setSuccess] = React.useState<string | null>(null);

	const selectedVersion = versions.find(version => version.id === selectedVersionId) ?? null;
	const activeVersion = versions.find(version => version.is_active) ?? null;
	const activeSummary = summarizeInstrument(activeVersion?.content ?? canonicalInstrument);
	const previewSummary = summarizeInstrument(selectedVersion?.content ?? canonicalInstrument);
	const hasUsableInstrument = Boolean(canonicalInstrument || versions.length > 0);
	const parsedEditorInstrument = React.useMemo(() => {
		if (!editorValue.trim()) return null;
		try {
			return JSON.parse(editorValue) as {
				survey_name?: string;
				version?: string;
				sections?: EditableSection[];
				scoring_items?: EditableItem[];
			};
		} catch {
			return null;
		}
	}, [editorValue]);
	const groupedQuestionItems = React.useMemo(() => {
		const items = parsedEditorInstrument?.scoring_items ?? [];
		const groups = new Map<string, EditableItem[]>();
		for (const item of items) {
			const key = item.block_title || item.block || "Other";
			const existing = groups.get(key) ?? [];
			existing.push(item);
			groups.set(key, existing);
		}
		return Array.from(groups.entries());
	}, [parsedEditorInstrument]);

	const loadAll = React.useCallback(async () => {
		if (!session) return;
		setLoading(true);
		setError(null);
		try {
			const [versionRows, canonical] = await Promise.all([
				fetchInstrumentVersions(session, "yee"),
				fetchCanonicalInstrument()
			]);
			setVersions(versionRows);
			setCanonicalInstrument(canonical);
			const nextSelected = versionRows.find(version => version.is_active)?.id ?? versionRows[0]?.id ?? null;
			setSelectedVersionId(nextSelected);
			setEditorValue(current => current || JSON.stringify(canonical, null, 2));
			setInstrumentVersion(current => {
				if (current && current !== "1") {
					return current;
				}
				const canonicalVersion =
					typeof canonical.version === "string"
						? canonical.version
						: typeof canonical.instrument_version === "string"
							? canonical.instrument_version
							: "1";
				return `${canonicalVersion}-copy`;
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not load instrument data.");
		} finally {
			setLoading(false);
		}
	}, [session]);

	React.useEffect(() => {
		void loadAll();
	}, [loadAll]);

	if (!session) return null;

	async function handleCreate() {
		if (!session) return;
		setSaving(true);
		setError(null);
		setSuccess(null);
		try {
			const parsed = JSON.parse(editorValue) as Record<string, unknown>;
			const created = await createInstrumentVersion(
				session,
				{
					instrument_key: instrumentKey.trim() || "yee",
					instrument_version: instrumentVersion.trim(),
					content: parsed
				},
				activateOnCreate
			);
			setSuccess(`Created instrument version ${created.instrument_version}.`);
			await loadAll();
			setSelectedVersionId(created.id);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not create instrument version.");
		} finally {
			setSaving(false);
		}
	}

	async function handleActivate(instrumentId: string) {
		if (!session) return;
		setSaving(true);
		setError(null);
		setSuccess(null);
		try {
			const updated = await updateInstrumentStatus(session, instrumentId, { is_active: true });
			setSuccess(`Activated instrument version ${updated.instrument_version}.`);
			await loadAll();
			setSelectedVersionId(updated.id);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not activate this instrument version.");
		} finally {
			setSaving(false);
		}
	}

	function updateEditor(mutator: (draft: Record<string, unknown>) => void) {
		try {
			const draft = JSON.parse(editorValue || "{}") as Record<string, unknown>;
			mutator(draft);
			setEditorValue(JSON.stringify(draft, null, 2));
			setError(null);
		} catch {
			setError("The advanced JSON editor currently contains invalid JSON, so the friendly text editor cannot update it safely.");
		}
	}

	return (
		<div className="space-y-6">
			<Card className="rounded-[1.75rem] border-emerald-200/70 bg-emerald-50/70 shadow-sm">
				<CardHeader>
					<CardTitle>What this tool is for</CardTitle>
					<CardDescription className="text-slate-700">
						This admin page manages versioned YEE survey instruments for the website. The active version is what the website uses when auditors and managers open the YEE survey.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
					<div className="rounded-2xl border border-emerald-200 bg-white/80 p-4">
						<p className="font-medium text-slate-900">1. Load the current YEE instrument</p>
						<p className="mt-1">Use the current website instrument as your starting point instead of pasting JSON from scratch.</p>
					</div>
					<div className="rounded-2xl border border-emerald-200 bg-white/80 p-4">
						<p className="font-medium text-slate-900">2. Save a new version</p>
						<p className="mt-1">Create a clean versioned snapshot before changing what the website should use.</p>
					</div>
					<div className="rounded-2xl border border-emerald-200 bg-white/80 p-4">
						<p className="font-medium text-slate-900">3. Activate when ready</p>
						<p className="mt-1">Only the active version drives the live YEE survey shown across the website.</p>
					</div>
				</CardContent>
			</Card>

			{error ? (
				<Card className="rounded-[1.75rem] border-rose-200 bg-rose-50 shadow-sm">
					<CardHeader>
						<CardTitle>Instrument tool needs attention</CardTitle>
						<CardDescription className="text-rose-700">
							We could not fully load the instrument data from the backend.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2 text-sm text-rose-700">
						<p>{error}</p>
						<p className="text-slate-700">
							If this is your first time on this page, the website should still be able to bootstrap the current YEE instrument automatically. Refresh once after the backend fix, then use <span className="font-medium">Load Current YEE Instrument</span> to start your first saved version.
						</p>
					</CardContent>
				</Card>
			) : null}

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Active YEE instrument</CardTitle>
						<CardDescription>
							The website survey uses the active version below. If no database-managed version exists yet, the current canonical YEE instrument is shown.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						<MetricCard label="Instrument" value={activeSummary.name} />
						<MetricCard label="Key" value={activeSummary.key} />
						<MetricCard label="Version" value={activeSummary.version} />
						<MetricCard label="Sections / Items" value={`${activeSummary.sections} / ${activeSummary.items}`} />
					</CardContent>
				</Card>

				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Selected preview</CardTitle>
						<CardDescription>Use this summary to confirm you are creating or activating the correct version.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 text-sm text-slate-700">
						<p><span className="font-medium text-slate-900">Instrument:</span> {previewSummary.name}</p>
						<p><span className="font-medium text-slate-900">Version:</span> {previewSummary.version}</p>
						<p><span className="font-medium text-slate-900">Sections:</span> {previewSummary.sections}</p>
						<p><span className="font-medium text-slate-900">Scoring items:</span> {previewSummary.items}</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Instrument versions</CardTitle>
						<CardDescription>Review every saved version and activate the one the website should use.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{loading ? (
							<p className="text-sm text-slate-500">Loading instrument versions...</p>
						) : versions.length === 0 ? (
							<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm text-slate-600">
								<p className="font-medium text-slate-900">No saved versions yet.</p>
								<p className="mt-1">
									This usually means you have not created the first database-managed version yet.
									Start by clicking <span className="font-medium">Load Current YEE Instrument</span>, then save it as your first version.
								</p>
							</div>
						) : (
							versions.map(version => (
								<div
									key={version.id}
									className={`rounded-2xl border p-4 transition ${
										selectedVersionId === version.id ? "border-emerald-300 bg-emerald-50/70" : "border-slate-200 bg-white"
									}`}
								>
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div>
											<p className="font-medium text-slate-900">{version.instrument_version}</p>
											<p className="mt-1 text-xs text-slate-500">
												Created {new Date(version.created_at).toLocaleString()}
											</p>
										</div>
										<div className="flex flex-wrap gap-2">
											{version.is_active ? (
												<Badge className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>
											) : null}
											<Button
												type="button"
												variant="outline"
												className="rounded-2xl"
												onClick={() => setSelectedVersionId(version.id)}
											>
												Preview
											</Button>
											{!version.is_active ? (
												<Button
													type="button"
													className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]"
													onClick={() => void handleActivate(version.id)}
													disabled={saving}
												>
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

				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Create a new instrument version</CardTitle>
						<CardDescription>
							Most of the time, you should duplicate the current YEE instrument, give the copy a new version label, and only open the raw JSON if you are intentionally editing the survey structure.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
							<p className="font-medium text-slate-900">What you actually need here</p>
							<p className="mt-1">
								You do <span className="font-medium">not</span> need to rewrite the huge JSON by hand unless you are intentionally changing the survey questions, section structure, or scoring rules.
							</p>
							<p className="mt-2">
								Most admins should:
							</p>
							<ol className="mt-2 list-decimal space-y-1 pl-5">
								<li>duplicate the current active YEE instrument</li>
								<li>give the new copy a cleaner version name</li>
								<li>activate it only when ready</li>
							</ol>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="instrument-version">New Version Label</Label>
								<Input
									id="instrument-version"
									value={instrumentVersion}
									onChange={event => setInstrumentVersion(event.target.value)}
									placeholder="Example: yee-v1, spring-2026, janet-review-1"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="instrument-key">Instrument Key</Label>
								<Input
									id="instrument-key"
									value={instrumentKey}
									onChange={event => setInstrumentKey(event.target.value)}
									readOnly
									className="bg-slate-50 text-slate-500"
								/>
							</div>
						</div>
						<div className="flex flex-wrap gap-3">
							<Button
								type="button"
								variant="outline"
								className="rounded-2xl"
								onClick={() => {
									if (!canonicalInstrument) return;
									setEditorValue(JSON.stringify(canonicalInstrument, null, 2));
									setSuccess("Loaded the current website YEE instrument into the editor.");
									setError(null);
								}}
								disabled={!canonicalInstrument}
							>
								Duplicate Active YEE Instrument
							</Button>
							<Button
								type="button"
								variant="outline"
								className="rounded-2xl"
								onClick={() => {
									if (!selectedVersion) return;
									setEditorValue(JSON.stringify(selectedVersion.content, null, 2));
									setInstrumentVersion(`${selectedVersion.instrument_version}-copy`);
									setSuccess(`Loaded version ${selectedVersion.instrument_version} into the editor.`);
									setError(null);
								}}
								disabled={!selectedVersion}
							>
								Duplicate Selected Version
							</Button>
						</div>
						<div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
							<span className="font-medium">Advanced only:</span> the raw JSON editor below is for changing the survey definition itself, not for ordinary report or dashboard use.
						</div>
						<div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
							<div>
								<h3 className="text-base font-semibold text-slate-900">Friendly survey text editor</h3>
								<p className="mt-1 text-sm text-slate-600">
									Use this section to edit survey wording without touching JSON. These changes still save into the instrument version you create below.
								</p>
							</div>
							{parsedEditorInstrument ? (
								<div className="space-y-5">
									<div className="space-y-2">
										<Label htmlFor="friendly-survey-name">Survey Title</Label>
										<Input
											id="friendly-survey-name"
											value={parsedEditorInstrument.survey_name ?? ""}
											onChange={event =>
												updateEditor(draft => {
													draft.survey_name = event.target.value;
												})
											}
										/>
									</div>
									<div className="space-y-4">
										<p className="text-sm font-medium text-slate-900">Section text</p>
										{(parsedEditorInstrument.sections ?? []).map((section, index) => (
											<div key={`${section.block}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
												<p className="text-sm font-semibold text-slate-900">{section.title || section.block}</p>
												<div className="space-y-2">
													<Label>Section Title</Label>
													<Input
														value={section.title ?? ""}
														onChange={event =>
															updateEditor(draft => {
																const sections = (draft.sections as EditableSection[] | undefined) ?? [];
																if (!sections[index]) return;
																sections[index] = { ...sections[index], title: event.target.value };
																draft.sections = sections;
															})
														}
													/>
												</div>
												<div className="space-y-2">
													<Label>Instructions</Label>
													<Textarea
														value={section.intro_text ?? ""}
														onChange={event =>
															updateEditor(draft => {
																const sections = (draft.sections as EditableSection[] | undefined) ?? [];
																if (!sections[index]) return;
																sections[index] = { ...sections[index], intro_text: event.target.value };
																draft.sections = sections;
															})
														}
														className="min-h-[8rem]"
													/>
												</div>
												<div className="space-y-2">
													<Label>Optional Comment Prompt</Label>
													<Textarea
														value={section.comment_prompt ?? ""}
														onChange={event =>
															updateEditor(draft => {
																const sections = (draft.sections as EditableSection[] | undefined) ?? [];
																if (!sections[index]) return;
																sections[index] = { ...sections[index], comment_prompt: event.target.value };
																draft.sections = sections;
															})
														}
														className="min-h-[5rem]"
													/>
												</div>
											</div>
										))}
									</div>
									<div className="space-y-4">
										<p className="text-sm font-medium text-slate-900">Question text</p>
										{groupedQuestionItems.map(([groupName, items]) => (
											<div key={groupName} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
												<p className="text-sm font-semibold text-slate-900">{groupName}</p>
												{items.map(item => {
													const itemIndex = (parsedEditorInstrument.scoring_items ?? []).findIndex(
														candidate => candidate.item_id === item.item_id
													);
													return (
														<div key={item.item_id} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
															<p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.item_id}</p>
															<Textarea
																value={item.question_text ?? ""}
																onChange={event =>
																	updateEditor(draft => {
																		const scoringItems = (draft.scoring_items as EditableItem[] | undefined) ?? [];
																		if (itemIndex < 0 || !scoringItems[itemIndex]) return;
																		scoringItems[itemIndex] = {
																			...scoringItems[itemIndex],
																			question_text: event.target.value
																		};
																		draft.scoring_items = scoringItems;
																	})
																}
																className="min-h-[5rem]"
															/>
														</div>
													);
												})}
											</div>
										))}
									</div>
								</div>
							) : (
								<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-sm text-slate-600">
									Load the current or selected instrument first so the friendly survey text editor has content to work with.
								</div>
							)}
						</div>
						<div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
							<input
								id="activate-on-create"
								type="checkbox"
								checked={activateOnCreate}
								onChange={event => setActivateOnCreate(event.target.checked)}
								className="h-4 w-4 rounded border-slate-300"
							/>
							<Label htmlFor="activate-on-create" className="cursor-pointer text-sm font-medium">
								Activate this version immediately after creating it
							</Label>
						</div>
						<div className="space-y-3">
							<Button
								type="button"
								variant="ghost"
								className="rounded-2xl px-0 text-slate-700 hover:bg-transparent hover:text-slate-900"
								onClick={() => setShowAdvancedEditor(current => !current)}
							>
								{showAdvancedEditor ? "Hide Advanced JSON Editor" : "Show Advanced JSON Editor"}
							</Button>
							{showAdvancedEditor ? (
								<div className="space-y-2">
									<Label htmlFor="instrument-json">Instrument JSON</Label>
									<Textarea
										id="instrument-json"
										value={editorValue}
										onChange={event => setEditorValue(event.target.value)}
										className="min-h-[28rem] font-mono text-xs"
										placeholder="Paste or edit the full YEE instrument JSON here..."
									/>
									{!hasUsableInstrument && !loading ? (
										<p className="text-xs text-slate-500">
											No instrument content is loaded yet. Once the backend responds correctly, the current YEE instrument should load here as your starting point.
										</p>
									) : null}
								</div>
							) : (
								<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-sm text-slate-600">
									The raw instrument JSON is hidden by default to keep this page easier to use. Open it only if you need to change the survey structure itself.
								</div>
							)}
						</div>
						<div className="flex flex-wrap items-center gap-3">
							<Button
								type="button"
								className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]"
								onClick={() => void handleCreate()}
								disabled={saving || !instrumentVersion.trim() || !editorValue.trim()}
							>
								{saving ? "Saving..." : "Create Instrument Version"}
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

function MetricCard({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
			<p className="text-sm text-slate-500">{label}</p>
			<p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
		</div>
	);
}
