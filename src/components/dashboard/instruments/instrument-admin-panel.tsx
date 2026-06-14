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
import { cn } from "@/lib/utils";

type EditableSection = {
	block: string;
	title?: string;
	intro_text?: string;
	comment_prompt?: string;
};

type EditableItem = {
	item_id: string;
	base_question_id?: string;
	block?: string;
	block_title?: string;
	question_text?: string;
	item_kind?: string;
	choices?: Record<string, { Display?: string }>;
	answers?: Record<string, { Display?: string }>;
	score_entries?: Array<Record<string, unknown>>;
};

type InstrumentOption = {
	value: string;
	label: string;
	notes?: string | null;
};

type InstrumentPreAuditQuestion = {
	id: string;
	title: string;
	prompt: string;
	description?: string;
	options?: InstrumentOption[];
	multi_select?: boolean;
	required?: boolean;
	auto_generated?: boolean;
};

type InstrumentScaleRule = {
	value: string;
	label: string;
	add?: number | null;
	boost?: number | null;
	follow_up_behavior?: string | null;
	tag?: string | null;
};

type InstrumentScaleGuidance = {
	id: string;
	title: string;
	prompt: string;
	description?: string;
	rules?: InstrumentScaleRule[];
};

type InstrumentLegalDocument = {
	id: string;
	title: string;
	last_updated?: string | null;
	content: string;
	document_type?: string | null;
};

type StructuredInstrumentContent = {
	survey_name?: string;
	version?: string;
	instrument_version?: string;
	instrument_name?: string;
	instrument_key?: string;
	sections?: EditableSection[];
	scoring_items?: EditableItem[];
	preamble?: string[];
	pre_audit_questions?: InstrumentPreAuditQuestion[];
	scale_guidance?: InstrumentScaleGuidance[];
	legal_documents?: InstrumentLegalDocument[];
};

type DetailTabKey =
	| "preamble"
	| "sections"
	| "spreadsheet"
	| "preAudit"
	| "scaleGuidance"
	| "legalDocuments";

const detailTabs: { key: DetailTabKey; label: string }[] = [
	{ key: "preamble", label: "Preamble" },
	{ key: "sections", label: "Sections" },
	{ key: "spreadsheet", label: "Spreadsheet" },
	{ key: "preAudit", label: "Pre-Audit Questions" },
	{ key: "scaleGuidance", label: "Scale Guidance" },
	{ key: "legalDocuments", label: "Legal Documents" }
];

function summarizeInstrument(content: Record<string, unknown> | null) {
	if (!content) {
		return {
			name: "Unavailable",
			key: "yee",
			version: "Unknown",
			sections: 0,
			items: 0,
			preAuditQuestions: 0,
			scaleGuidance: 0,
			legalDocuments: 0
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
		items: Array.isArray(content.scoring_items) ? content.scoring_items.length : 0,
		preAuditQuestions: Array.isArray(content.pre_audit_questions) ? content.pre_audit_questions.length : 0,
		scaleGuidance: Array.isArray(content.scale_guidance) ? content.scale_guidance.length : 0,
		legalDocuments: Array.isArray(content.legal_documents) ? content.legal_documents.length : 0
	};
}

function getTypedContent(content: Record<string, unknown> | null): StructuredInstrumentContent | null {
	if (!content) {
		return null;
	}
	return content as StructuredInstrumentContent;
}

function getQuestionGroups(content: StructuredInstrumentContent | null) {
	const groups = new Map<
		string,
		{
			section: EditableSection | null;
			items: EditableItem[];
		}
	>();
	const sectionList = content?.sections ?? [];
	const items = content?.scoring_items ?? [];

	for (const section of sectionList) {
		const key = section.block;
		groups.set(key, { section, items: [] });
	}

	for (const item of items) {
		const key = item.block ?? item.block_title ?? "other";
		const existing = groups.get(key) ?? { section: null, items: [] };
		existing.items.push(item);
		groups.set(key, existing);
	}

	return Array.from(groups.entries()).map(([blockKey, value]) => ({
		blockKey,
		section: value.section,
		items: value.items
	}));
}

function buildSpreadsheetRows(content: StructuredInstrumentContent | null) {
	const groups = getQuestionGroups(content);
	return groups.flatMap(group => {
		const sectionTitle = group.section?.title || group.items[0]?.block_title || group.blockKey;
		const sectionDescription = group.section?.intro_text || "";
		const sectionPrompt = group.section?.comment_prompt || "";

		const headerRow = {
			id: `section-${group.blockKey}`,
			number: `Section ${sectionTitle}`,
			section: sectionTitle,
			prompt: [
				sectionDescription ? `Description: ${sectionDescription}` : "",
				sectionPrompt ? `Notes prompt: ${sectionPrompt}` : ""
			]
				.filter(Boolean)
				.join("\n\n")
		};

		const questionRows = group.items.map(item => ({
			id: item.item_id,
			number: item.item_id,
			section: "—",
			prompt: item.question_text || item.item_id
		}));

		return [headerRow, ...questionRows];
	});
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
	const [expandedVersionId, setExpandedVersionId] = React.useState<string | null>(null);
	const [detailTabByVersion, setDetailTabByVersion] = React.useState<Record<string, DetailTabKey>>({});
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
	const selectedContent = getTypedContent(
		(selectedVersion?.content as Record<string, unknown> | undefined) ?? canonicalInstrument
	);

	const parsedEditorInstrument = React.useMemo(() => {
		if (!editorValue.trim()) return null;
		try {
			return JSON.parse(editorValue) as StructuredInstrumentContent;
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
			setExpandedVersionId(nextSelected);
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
			setSuccess(
				activateOnCreate
					? `Created and activated instrument version ${created.instrument_version}.`
					: `Created draft instrument version ${created.instrument_version}.`
			);
			await loadAll();
			setSelectedVersionId(created.id);
			setExpandedVersionId(created.id);
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
			setExpandedVersionId(updated.id);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not activate this instrument version.");
		} finally {
			setSaving(false);
		}
	}

	function updateEditor(mutator: (draft: StructuredInstrumentContent) => void) {
		try {
			const draft = JSON.parse(editorValue || "{}") as StructuredInstrumentContent;
			mutator(draft);
			setEditorValue(JSON.stringify(draft, null, 2));
			setError(null);
		} catch {
			setError(
				"The advanced JSON editor currently contains invalid JSON, so the friendly editor cannot update it safely."
			);
		}
	}

	function loadIntoEditor(content: Record<string, unknown>, versionLabel: string, message: string) {
		setEditorValue(JSON.stringify(content, null, 2));
		setInstrumentVersion(versionLabel);
		setShowAdvancedEditor(false);
		setSuccess(message);
		setError(null);
	}

	function openVersionDetails(versionId: string) {
		setSelectedVersionId(versionId);
		setExpandedVersionId(current => (current === versionId ? null : versionId));
	}

	function setDetailTab(versionId: string, tab: DetailTabKey) {
		setDetailTabByVersion(current => ({ ...current, [versionId]: tab }));
	}

	return (
		<div className="space-y-6">
			<Card className="rounded-[1.75rem] border-[#3b3027] bg-[#352b25] text-white shadow-sm">
				<CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
					<div className="space-y-2">
						<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d6c9bc]">
							Administrator Workspace
						</p>
						<CardTitle className="text-4xl text-white">Instrument Management</CardTitle>
						<CardDescription className="max-w-3xl text-base text-[#e9dfd4]">
							Review the active YEE instrument, open any saved version, duplicate it into a draft,
							edit the current wording, and publish the version the website should use.
						</CardDescription>
					</div>
					<div className="flex flex-wrap gap-3">
						<Button
							type="button"
							variant="outline"
							className="rounded-2xl border-white/25 bg-white/90 text-[#352b25] hover:bg-white"
							onClick={() => {
								if (!canonicalInstrument) return;
								const canonicalSummary = summarizeInstrument(canonicalInstrument);
								loadIntoEditor(
									canonicalInstrument,
									`${canonicalSummary.version}-copy`,
									"Opened the active website instrument in the editor."
								);
							}}
							disabled={!canonicalInstrument}
						>
							Open Current Version
						</Button>
						<Button
							type="button"
							className="rounded-2xl bg-[#3e8f63] text-white hover:bg-[#347b55]"
							onClick={() => {
								if (!selectedVersion) return;
								loadIntoEditor(
									selectedVersion.content,
									`${selectedVersion.instrument_version}-draft`,
									`Opened ${selectedVersion.instrument_version} in the editor as a new draft.`
								);
							}}
							disabled={!selectedVersion}
						>
							Create New Draft
						</Button>
					</div>
				</CardHeader>
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
							If this is your first time on this page, the website should still be able to bootstrap the
							current YEE instrument automatically. Refresh once after the backend fix, then use
							<span className="font-medium"> Open Current Version </span>
							to start your first saved draft.
						</p>
					</CardContent>
				</Card>
			) : null}

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Version history</CardTitle>
						<CardDescription>
							Active instrument: {activeSummary.version} · new drafts stay separate until you activate them.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{loading ? (
							<p className="text-sm text-slate-500">Loading instrument versions...</p>
						) : versions.length === 0 ? (
							<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm text-slate-600">
								<p className="font-medium text-slate-900">No saved versions yet.</p>
								<p className="mt-1">
									This usually means you have not created the first database-managed version yet. Start
									by opening the current website instrument, adjust the version label, and save it as
									your first draft.
								</p>
							</div>
						) : (
							versions.map(version => {
								const tab = detailTabByVersion[version.id] ?? "preamble";
								return (
									<div key={version.id} className="rounded-2xl border border-slate-200 bg-white">
										<div
											className={cn(
												"flex flex-wrap items-start justify-between gap-3 rounded-2xl p-4 transition",
												selectedVersionId === version.id ? "bg-emerald-50/70" : "bg-white"
											)}
										>
											<div className="space-y-1">
												<div className="flex flex-wrap items-center gap-2">
													<p className="text-xl font-semibold text-slate-900">
														{version.instrument_version}
													</p>
													{version.is_active ? (
														<Badge className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
															Active
														</Badge>
													) : (
														<Badge className="rounded-full bg-slate-100 text-slate-600 hover:bg-slate-100">
															Inactive
														</Badge>
													)}
												</div>
												<p className="text-sm text-slate-500">
													Created {new Date(version.created_at).toLocaleString()}
												</p>
											</div>
											<div className="flex flex-wrap gap-2">
												<Button
													type="button"
													variant="outline"
													className="rounded-2xl"
													onClick={() => openVersionDetails(version.id)}
												>
													{expandedVersionId === version.id ? "Hide Details" : "View Details"}
												</Button>
												<Button
													type="button"
													className="rounded-2xl bg-[#1f5f45] text-white hover:bg-[#194e3a]"
													onClick={() => {
														loadIntoEditor(
															version.content,
															`${version.instrument_version}-draft`,
															`Opened ${version.instrument_version} in the editor.`
														);
														setSelectedVersionId(version.id);
													}}
												>
													Edit this version
												</Button>
												{!version.is_active ? (
													<Button
														type="button"
														className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]"
														onClick={() => void handleActivate(version.id)}
														disabled={saving}
													>
														Make Active
													</Button>
												) : null}
											</div>
										</div>
										{expandedVersionId === version.id ? (
											<div className="border-t border-slate-200 px-4 pb-4 pt-5">
												<VersionDetailsPanel
													content={getTypedContent(version.content)}
													tab={tab}
													onTabChange={nextTab => setDetailTab(version.id, nextTab)}
												/>
											</div>
										) : null}
									</div>
								);
							})
						)}
					</CardContent>
				</Card>

				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Selected preview</CardTitle>
						<CardDescription>
							Use this summary to confirm you are opening, editing, or activating the intended version.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 text-sm text-slate-700">
						<p>
							<span className="font-medium text-slate-900">Instrument:</span> {previewSummary.name}
						</p>
						<p>
							<span className="font-medium text-slate-900">Version:</span> {previewSummary.version}
						</p>
						<p>
							<span className="font-medium text-slate-900">Sections:</span> {previewSummary.sections}
						</p>
						<p>
							<span className="font-medium text-slate-900">Scoring items:</span> {previewSummary.items}
						</p>
						<p>
							<span className="font-medium text-slate-900">Pre-audit questions:</span>{" "}
							{previewSummary.preAuditQuestions}
						</p>
						<p>
							<span className="font-medium text-slate-900">Scale guidance cards:</span>{" "}
							{previewSummary.scaleGuidance}
						</p>
						<p>
							<span className="font-medium text-slate-900">Legal documents:</span>{" "}
							{previewSummary.legalDocuments}
						</p>
					</CardContent>
				</Card>
			</div>

			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle>Create and publish a YEE instrument version</CardTitle>
					<CardDescription>
						Use the current website instrument as your starting point, make wording changes, save a new
						version, and activate it only when you are ready for auditors and managers to see it.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
					<div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
						<p className="font-medium text-slate-900">1. Open the current version</p>
						<p className="mt-1">
							Use <span className="font-medium">Open Current Version</span> or
							<span className="font-medium"> Edit this version</span> so you start with the full existing
							YEE content instead of retyping anything.
						</p>
					</div>
					<div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
						<p className="font-medium text-slate-900">2. Save a new version label</p>
						<p className="mt-1">
							Adjust the version label, update the wording you want, and save the complete snapshot as a
							new draft.
						</p>
					</div>
					<div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
						<p className="font-medium text-slate-900">3. Publish when ready</p>
						<p className="mt-1">
							Activate the new version only when you want the live website and re-downloaded app to use
							that instrument definition.
						</p>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Current active YEE instrument</CardTitle>
						<CardDescription>
							The survey uses the active version below. If no database-managed version exists yet, the
							current canonical YEE instrument is shown.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						<MetricCard label="Instrument" value={activeSummary.name} />
						<MetricCard label="Key" value={activeSummary.key} />
						<MetricCard label="Version" value={activeSummary.version} />
						<MetricCard label="Sections / Items" value={`${activeSummary.sections} / ${activeSummary.items}`} />
					</CardContent>
					{selectedContent ? (
						<div className="px-6 pb-6">
							<VersionDetailsPanel
								content={selectedContent}
								tab={detailTabByVersion.preview ?? "sections"}
								onTabChange={nextTab => setDetailTabByVersion(current => ({ ...current, preview: nextTab }))}
							/>
						</div>
					) : null}
				</Card>

				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Create a new instrument version</CardTitle>
						<CardDescription>
							Most of the time, duplicate the active or selected version, change the wording you need,
							and save it as a new draft. Use raw JSON only for structural edits.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="instrument-version">New Version Label</Label>
								<Input
									id="instrument-version"
									value={instrumentVersion}
									onChange={event => setInstrumentVersion(event.target.value)}
									placeholder="Example: yee-v1, janet-review-1, spring-2026"
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

						<div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
							<span className="font-medium">Advanced only:</span> the raw JSON editor below is for
							changing the survey definition itself, not for ordinary dashboard use.
						</div>

						<div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
							<div>
								<h3 className="text-base font-semibold text-slate-900">Friendly survey text editor</h3>
								<p className="mt-1 text-sm text-slate-600">
									Use this section to edit survey wording without touching JSON. The content shown here
									comes from the version you opened above.
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
									<div className="space-y-3">
										<p className="text-sm font-medium text-slate-900">Preamble copy</p>
										{(parsedEditorInstrument.preamble ?? []).length > 0 ? (
											(parsedEditorInstrument.preamble ?? []).map((paragraph, index) => (
												<div key={`preamble-${index}`} className="space-y-2">
													<Label>Preamble paragraph {index + 1}</Label>
													<Textarea
														value={paragraph}
														onChange={event =>
															updateEditor(draft => {
																const preamble = [...(draft.preamble ?? [])];
																preamble[index] = event.target.value;
																draft.preamble = preamble;
															})
														}
														className="min-h-[6rem]"
													/>
												</div>
											))
										) : (
											<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-sm text-slate-600">
												No preamble copy is present in the current editor payload.
											</div>
										)}
									</div>
									<div className="space-y-4">
										<p className="text-sm font-medium text-slate-900">Section text</p>
										{(parsedEditorInstrument.sections ?? []).map((section, index) => (
											<div
												key={`${section.block}-${index}`}
												className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
											>
												<p className="text-sm font-semibold text-slate-900">
													{section.title || section.block}
												</p>
												<div className="space-y-2">
													<Label>Section Title</Label>
													<Input
														value={section.title ?? ""}
														onChange={event =>
															updateEditor(draft => {
																const sections = [...(draft.sections ?? [])];
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
																const sections = [...(draft.sections ?? [])];
																if (!sections[index]) return;
																sections[index] = {
																	...sections[index],
																	intro_text: event.target.value
																};
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
																const sections = [...(draft.sections ?? [])];
																if (!sections[index]) return;
																sections[index] = {
																	...sections[index],
																	comment_prompt: event.target.value
																};
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
											<div
												key={groupName}
												className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
											>
												<p className="text-sm font-semibold text-slate-900">{groupName}</p>
												{items.map(item => {
													const itemIndex = (parsedEditorInstrument.scoring_items ?? []).findIndex(
														candidate => candidate.item_id === item.item_id
													);
													return (
														<div
															key={item.item_id}
															className="space-y-2 rounded-xl border border-slate-200 bg-white p-3"
														>
															<p className="text-xs font-medium uppercase tracking-wide text-slate-500">
																{item.item_id}
															</p>
															<Textarea
																value={item.question_text ?? ""}
																onChange={event =>
																	updateEditor(draft => {
																		const scoringItems = [...(draft.scoring_items ?? [])];
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
									Open the current or a saved instrument version first so the friendly editor has
									content to work with.
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
											No instrument content is loaded yet. Once the backend responds correctly, the
											current YEE instrument should load here as your starting point.
										</p>
									) : null}
								</div>
							) : (
								<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-sm text-slate-600">
									The raw instrument JSON is hidden by default to keep this page easier to use. Open
									it only if you need to change the survey structure itself.
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
								{saving ? "Saving..." : activateOnCreate ? "Save and Publish Version" : "Save Draft Version"}
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

function VersionDetailsPanel({
	content,
	tab,
	onTabChange
}: {
	content: StructuredInstrumentContent | null;
	tab: DetailTabKey;
	onTabChange: (tab: DetailTabKey) => void;
}) {
	const summary = summarizeInstrument((content as Record<string, unknown> | null) ?? null);
	const questionGroups = getQuestionGroups(content);
	const spreadsheetRows = buildSpreadsheetRows(content);

	return (
		<div className="space-y-5">
			<div className="grid gap-3 md:grid-cols-4">
				<MetricCard label="Sections" value={String(summary.sections)} />
				<MetricCard label="Total Questions" value={String(summary.items)} />
				<MetricCard label="Pre-Audit Questions" value={String(summary.preAuditQuestions)} />
				<MetricCard label="Scale Guidance" value={String(summary.scaleGuidance)} />
			</div>
			<div className="flex flex-wrap gap-2">
				{detailTabs.map(detailTab => (
					<button
						key={detailTab.key}
						type="button"
						onClick={() => onTabChange(detailTab.key)}
						className={cn(
							"rounded-xl border px-3 py-2 text-sm transition",
							tab === detailTab.key
								? "border-slate-900 bg-slate-900 text-white"
								: "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
						)}
					>
						{detailTab.label}
						{detailTab.key === "sections" ? ` (${summary.sections})` : ""}
						{detailTab.key === "preAudit" ? ` (${summary.preAuditQuestions})` : ""}
						{detailTab.key === "scaleGuidance" ? ` (${summary.scaleGuidance})` : ""}
						{detailTab.key === "legalDocuments" ? ` (${summary.legalDocuments})` : ""}
					</button>
				))}
			</div>

			{tab === "preamble" ? <PreamblePanel paragraphs={content?.preamble ?? []} /> : null}
			{tab === "sections" ? <SectionsPanel groups={questionGroups} /> : null}
			{tab === "spreadsheet" ? <SpreadsheetPanel rows={spreadsheetRows} /> : null}
			{tab === "preAudit" ? <PreAuditPanel questions={content?.pre_audit_questions ?? []} /> : null}
			{tab === "scaleGuidance" ? <ScaleGuidancePanel scales={content?.scale_guidance ?? []} /> : null}
			{tab === "legalDocuments" ? <LegalDocumentsPanel documents={content?.legal_documents ?? []} /> : null}
		</div>
	);
}

function PreamblePanel({ paragraphs }: { paragraphs: string[] }) {
	if (paragraphs.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm text-slate-600">
				No preamble content is stored for this version yet.
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{paragraphs.map((paragraph, index) => (
				<div key={`preamble-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5">
					<p className="text-lg font-semibold text-slate-900">
						{index === 0 ? "How the tool is structured" : `Preamble note ${index + 1}`}
					</p>
					<p className="mt-3 text-sm leading-7 text-slate-700">{paragraph}</p>
				</div>
			))}
		</div>
	);
}

function SectionsPanel({
	groups
}: {
	groups: Array<{ blockKey: string; section: EditableSection | null; items: EditableItem[] }>;
}) {
	if (groups.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm text-slate-600">
				No section content is stored for this version yet.
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{groups.map((group, index) => (
				<div key={group.blockKey} className="rounded-2xl border border-slate-200 bg-white p-5">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="space-y-2">
							<div className="flex flex-wrap items-center gap-2">
								<Badge className="rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-100">
									{index + 1}
								</Badge>
								<p className="text-xl font-semibold text-slate-900">
									{group.section?.title || group.items[0]?.block_title || group.blockKey}
								</p>
							</div>
							<p className="text-sm text-slate-600">
								{group.items.length} questions across {new Set(group.items.map(item => item.item_kind || "scored")).size} unique modes
							</p>
						</div>
					</div>
					{group.section?.intro_text ? (
						<div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700">
							<span className="font-medium text-slate-900">Instruction:</span> {group.section.intro_text}
						</div>
					) : null}
					{group.section?.comment_prompt ? (
						<div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-sm text-slate-700">
							<span className="font-medium text-slate-900">Notes Prompt:</span>{" "}
							{group.section.comment_prompt}
						</div>
					) : null}
					<div className="mt-4 space-y-3">
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
							Questions ({group.items.length})
						</p>
						{group.items.map(item => (
							<div key={item.item_id} className="rounded-2xl border border-slate-200 bg-white p-4">
								<div className="flex flex-wrap items-center gap-2">
									<Badge className="rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-100">
										{item.item_id}
									</Badge>
									{item.item_kind ? (
										<Badge className="rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
											{item.item_kind}
										</Badge>
									) : null}
									{item.answers && Object.keys(item.answers).length > 0 ? (
										<Badge className="rounded-lg bg-slate-900 text-white hover:bg-slate-900">
											Matrix
										</Badge>
									) : (
										<Badge className="rounded-lg bg-slate-900 text-white hover:bg-slate-900">
											Single select
										</Badge>
									)}
								</div>
								<p className="mt-3 text-lg font-medium text-slate-900">
									{item.question_text || item.item_id}
								</p>
								{item.choices && Object.keys(item.choices).length > 0 ? (
									<div className="mt-4 flex flex-wrap gap-2">
										{Object.entries(item.choices).map(([choiceId, choice]) => (
											<Badge
												key={`${item.item_id}-${choiceId}`}
												className="rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50"
											>
												{choice.Display || choiceId}
											</Badge>
										))}
									</div>
								) : null}
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

function SpreadsheetPanel({
	rows
}: {
	rows: Array<{ id: string; number: string; section: string; prompt: string }>;
}) {
	if (rows.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm text-slate-600">
				No spreadsheet rows are available for this version yet.
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
			<div className="grid grid-cols-[180px_240px_minmax(0,1fr)] border-b border-slate-200 bg-slate-50 px-6 py-4 text-sm font-semibold text-slate-700">
				<p>#</p>
				<p>Section</p>
				<p>Prompt</p>
			</div>
			<div className="max-h-[42rem] overflow-y-auto">
				{rows.map(row => (
					<div
						key={row.id}
						className="grid grid-cols-[180px_240px_minmax(0,1fr)] gap-4 border-b border-slate-100 px-6 py-4 text-sm text-slate-700 last:border-b-0"
					>
						<p className="font-medium text-slate-900 whitespace-pre-wrap">{row.number}</p>
						<p className="whitespace-pre-wrap">{row.section}</p>
						<p className="whitespace-pre-wrap leading-6">{row.prompt}</p>
					</div>
				))}
			</div>
		</div>
	);
}

function PreAuditPanel({ questions }: { questions: InstrumentPreAuditQuestion[] }) {
	if (questions.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm text-slate-600">
				No pre-audit questions are stored for this version yet.
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{questions.map(question => (
				<div key={question.id} className="rounded-2xl border border-slate-200 bg-white p-5">
					<div className="flex flex-wrap items-center gap-2">
						<Badge className="rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-100">
							{question.id}
						</Badge>
						{question.auto_generated ? (
							<Badge className="rounded-lg bg-slate-900 text-white hover:bg-slate-900">
								Auto generated
							</Badge>
						) : null}
						{question.required ? (
							<Badge className="rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
								Required
							</Badge>
						) : (
							<Badge className="rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-100">
								Optional
							</Badge>
						)}
						<Badge className="rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-100">
							{question.multi_select ? "Multi select" : "Single select"}
						</Badge>
					</div>
					<p className="mt-4 text-2xl font-semibold text-slate-900">{question.title}</p>
					<p className="mt-2 text-sm font-medium text-slate-900">{question.prompt}</p>
					{question.description ? (
						<p className="mt-3 text-sm leading-7 text-slate-700">{question.description}</p>
					) : null}
					{question.options && question.options.length > 0 ? (
						<div className="mt-4 flex flex-wrap gap-2">
							{question.options.map(option => (
								<Badge
									key={`${question.id}-${option.value}`}
									className="rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50"
								>
									{option.label}
								</Badge>
							))}
						</div>
					) : null}
				</div>
			))}
		</div>
	);
}

function ScaleGuidancePanel({ scales }: { scales: InstrumentScaleGuidance[] }) {
	if (scales.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm text-slate-600">
				No scale guidance is stored for this version yet.
			</div>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2">
			{scales.map(scale => (
				<div key={scale.id} className="rounded-2xl border border-slate-200 bg-white p-5">
					<div className="flex items-center gap-2">
						<Badge className="rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-100">
							{scale.title}
						</Badge>
					</div>
					<p className="mt-4 text-2xl font-semibold text-slate-900">{scale.title}</p>
					<p className="mt-3 text-sm font-medium text-slate-900">{scale.prompt}</p>
					{scale.description ? (
						<p className="mt-3 text-sm leading-7 text-slate-700">{scale.description}</p>
					) : null}
					<div className="mt-4 space-y-2">
						{(scale.rules ?? []).map(rule => (
							<div
								key={`${scale.id}-${rule.value}`}
								className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-700"
							>
								<div className="flex flex-wrap items-center gap-2">
									<span className="font-medium text-slate-900">{rule.label}</span>
									{rule.tag ? (
										<Badge className="rounded-full bg-white text-slate-600 hover:bg-white">
											{rule.tag}
										</Badge>
									) : null}
								</div>
								<div className="flex flex-wrap gap-2 text-xs">
									{typeof rule.add === "number" ? <span>Add: {rule.add}</span> : null}
									{typeof rule.boost === "number" ? <span>Boost: {rule.boost}</span> : null}
									{rule.follow_up_behavior ? <span>{rule.follow_up_behavior}</span> : null}
								</div>
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

function LegalDocumentsPanel({ documents }: { documents: InstrumentLegalDocument[] }) {
	if (documents.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm text-slate-600">
				No legal documents are stored for this version yet.
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{documents.map(document => (
				<div key={document.id} className="rounded-2xl border border-slate-200 bg-white p-5">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="space-y-2">
							<p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
								{document.document_type?.replaceAll("_", " ") || "Document"}
							</p>
							<p className="text-2xl font-semibold text-slate-900">{document.title}</p>
							{document.last_updated ? (
								<p className="text-sm text-slate-500">Last Updated: {document.last_updated}</p>
							) : null}
						</div>
						<Badge className="rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-100">
							{document.id}
						</Badge>
					</div>
					<p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
						{document.content}
					</p>
				</div>
			))}
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
